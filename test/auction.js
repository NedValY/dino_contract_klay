const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Controller = artifacts.require('Controller');
const Mapper = artifacts.require('Mapper');
const Offer = artifacts.require('Offer');
const Dino = artifacts.require('Dino');
const Dino721 = artifacts.require('Dino721');
const Auction = artifacts.require('Auction');
const MockKIP17 = artifacts.require('MockKIP17');
const KIP7 = artifacts.require('KIP7');

contract('Auction test', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.dino = await Dino.new(dev, dev, {from: dev});

        this.controller = await Controller.new(this.dino.address, {from : dev});
        await this.dino.setController(this.controller.address, {from : dev});

        this.dino721 = await Dino721.new(this.dino.address, {from : dev});
        await this.dino.setDino721(this.dino721.address, {from : dev});

        this.mapper = await Mapper.new(this.dino.address, {from: dev});
        await this.dino.setMapper(this.mapper.address, {from : dev});

        this.offer = await Offer.new(this.dino.address, {from : dev});
        await this.dino.setOffer(this.offer.address, {from : dev});

        this.test721 = await MockKIP17.new({from : dev});

        this.auction = await Auction.new(this.dino.address, {from : dev});
        await this.dino.setAuction(this.auction.address, {from : dev});

        await this.dino.setStaker(dev, {from: dev});
        await this.dino.setMinter(minter, {from: dev});

        await this.dino.mint(alice, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: alice});
        await this.dino.mint(bob, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: bob});
        await this.dino.mint(carol, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: carol});

        await this.dino.approve(this.auction.address, '1000000000', {from: alice});
        await this.dino.approve(this.auction.address, '1000000000', {from: bob});
        await this.dino.approve(this.auction.address, '1000000000', {from: carol});

    });

    it('should work with dino20 nft properly', async () => {

        await this.controller.newNFT(
            "0x0000000000000000000000000000000000000000",
            '0',
            "newNFT",
            "newNFT",
            "100000000",
            "100",
            {from: dev, value: "100000000000000000"});

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        let dino20Address = tokenInfo.dino20.valueOf();
        let dino20 = new web3.eth.Contract(KIP7.abi, dino20Address);

        await this.offer.deposit(dino20Address, '1000', {from: alice});
        await this.offer.deposit(dino20Address, '1000', {from: bob});
        await this.offer.deposit(dino20Address, '1000', {from: carol});

        await time.advanceBlockTo('100');

        await this.offer.claim(dino20Address, {from: alice});
        await this.offer.claim(dino20Address, {from: bob});
        await this.offer.claim(dino20Address, {from: carol});

        await this.offer.claimOwner(dino20Address, {from: dev});

        await dino20.methods.approve(this.auction.address, "10000000000000").send({from: dev, gas: 200000});
        let res = await this.auction.createAuction(
            this.dino.address,
            this.dino721.address,
            dev,
            '1',
            '200',
            '0',
            {from : dev});
        console.log(res.receipt.gasUsed);

        tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');

        assert.equal(tokenInfo.owner.valueOf(), this.auction.address);
        assert.equal((await dino20.methods.balanceOf(this.auction.address).call()), "51000000");

        console.log(BigInt((await this.dino.balanceOf(alice)).valueOf()).toString());
        console.log(BigInt((await this.dino.balanceOf(bob)).valueOf()).toString());
        console.log(BigInt((await this.dino.balanceOf(carol)).valueOf()).toString());
        console.log(BigInt((await this.dino.balanceOf(dev)).valueOf()).toString());

        res = await this.auction.bid('1', '1000', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(alice)).valueOf()).toString(), '8999');
        res = await this.auction.bid('1', '2000', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(bob)).valueOf()).toString(), '7999');

        await expectRevert(
            this.auction.bid('1', '2000', {from: carol}),
            "Dino: bid amount"
        );

        res = await this.auction.bid('1', '3000', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(carol)).valueOf()).toString(), '6999');
        res = await this.auction.bid('1', '4000', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(alice)).valueOf()).toString(), '5999');

        await expectRevert(
            this.auction.claim('1', {from: alice}),
            "Dino: not over"
        );
        await expectRevert(
            this.auction.claim('1', {from: dev}),
            "Dino: not over"
        );
        res = await this.auction.claim('1', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(bob)).valueOf()).toString(), '9999');

        res = await this.auction.claim('1', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(carol)).valueOf()).toString(), '9999');

        res = await this.auction.bid('1', '5000', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(alice)).valueOf()).toString(), '4999');
        res = await this.auction.bid('1', '5500', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(bob)).valueOf()).toString(), '4499');
        res = await this.auction.bid('1', '6000', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(carol)).valueOf()).toString(), '3999');

        res = await this.auction.claim('1', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(bob)).valueOf()).toString(), '9999');

        await time.advanceBlockTo('200');

        res = await this.auction.claim('1', {from: dev});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(dev)).valueOf()).toString(), '6003');
        res = await this.auction.claim('1', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(carol)).valueOf()).toString(), '3999');


        tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(tokenInfo.owner.valueOf(), carol);
        assert.equal((await dino20.methods.balanceOf(this.auction.address).call()), "0");


        res = await this.auction.claim('1', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await this.dino.balanceOf(alice)).valueOf()).toString(), '9999');
        await expectRevert(
            this.auction.claim('1', {from: bob}),
            "Dino: only once"
        );

        await expectRevert(
            this.auction.bid('1', '6100', {from: alice}),
            "Dino: over"
        );

    });

    it('should work with external nft properly', async () => {

        await this.controller.newNFT(
            "0x0000000000000000000000000000000000000000",
            '0',
            "newNFT",
            "newNFT",
            "300000",
            "300",
            {from: dev, value: "100000000000000000"});

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        let dino20Address = tokenInfo.dino20.valueOf();
        let dino20 = new web3.eth.Contract(KIP7.abi, dino20Address);

        await this.test721.mint(dev, '1', {from : dev});


        await this.offer.deposit(dino20Address, '1000', {from: alice});
        await this.offer.deposit(dino20Address, '1000', {from: bob});
        await this.offer.deposit(dino20Address, '1000', {from: carol});

        await time.advanceBlockTo('300');

        await this.offer.claim(dino20Address, {from: alice});
        await this.offer.claim(dino20Address, {from: bob});
        await this.offer.claim(dino20Address, {from: carol});

        await this.offer.claimOwner(dino20Address, {from: dev});


        await dino20.methods.approve(this.auction.address, "1000000").send({from: alice, gas: 200000});
        await dino20.methods.approve(this.auction.address, "1000000").send({from: bob, gas: 200000});
        await dino20.methods.approve(this.auction.address, "1000000").send({from: carol, gas: 200000});


        await this.test721.approve(this.auction.address, '1', {from : dev});
        let res = await this.auction.createAuction(
            dino20Address,
            this.test721.address,
            dev,
            '1',
            '400',
            '1000',
            {from : dev});
        console.log(res.receipt.gasUsed);

        assert.equal((await this.test721.ownerOf('1')).valueOf(), this.auction.address);

        console.log(BigInt((await dino20.methods.balanceOf(alice).call()).valueOf()).toString());
        console.log(BigInt((await dino20.methods.balanceOf(bob).call()).valueOf()).toString());
        console.log(BigInt((await dino20.methods.balanceOf(carol).call()).valueOf()).toString());
        console.log(BigInt((await dino20.methods.balanceOf(dev).call()).valueOf()).toString());

        await expectRevert(
            this.auction.bid('1', '1000', {from: alice}),
            "Dino: bid amount"
        );
        res = await this.auction.bid('1', '1001', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(alice).call()).valueOf()).toString(), '8999');
        res = await this.auction.bid('1', '2000', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(bob).call()).valueOf()).toString(), '8000');

        await expectRevert(
            this.auction.bid('1', '2000', {from: carol}),
            "Dino: bid amount"
        );

        res = await this.auction.bid('1', '3000', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(carol).call()).valueOf()).toString(), '7000');
        res = await this.auction.bid('1', '4000', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(alice).call()).valueOf()).toString(), '6000');

        await expectRevert(
            this.auction.claim('1', {from: alice}),
            "Dino: not over"
        );
        await expectRevert(
            this.auction.claim('1', {from: dev}),
            "Dino: not over"
        );
        res = await this.auction.claim('1', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(bob).call()).valueOf()).toString(), '10000');

        res = await this.auction.claim('1', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(carol).call()).valueOf()).toString(), '10000');

        res = await this.auction.bid('1', '5000', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(alice).call()).valueOf()).toString(), '5000');
        res = await this.auction.bid('1', '5500', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(bob).call()).valueOf()).toString(), '4500');
        res = await this.auction.bid('1', '6000', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(carol).call()).valueOf()).toString(), '4000');

        res = await this.auction.claim('1', {from: bob});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(bob).call()).valueOf()).toString(), '10000');

        await time.advanceBlockTo('400');

        res = await this.auction.claim('1', {from: dev});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(dev).call()).valueOf()).toString(), '276000');
        res = await this.auction.claim('1', {from: carol});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(carol).call()).valueOf()).toString(), '4000');


        assert.equal((await this.test721.ownerOf('1')).valueOf(), carol);


        res = await this.auction.claim('1', {from: alice});
        console.log(res.receipt.gasUsed);
        assert.equal(BigInt((await dino20.methods.balanceOf(alice).call()).valueOf()).toString(), '10000');
        await expectRevert(
            this.auction.claim('1', {from: bob}),
            "Dino: only once"
        );

        await expectRevert(
            this.auction.bid('1', '6100', {from: alice}),
            "Dino: over"
        );




    });

});