const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Controller = artifacts.require('Controller');
const Mapper = artifacts.require('Mapper');
const Offer = artifacts.require('Offer');
const Dino = artifacts.require('Dino');
const Dino721 = artifacts.require('Dino721');
const MockKIP17 = artifacts.require('MockKIP17');
const KIP7 = artifacts.require('KIP7');

contract('Controller test', ([alice, bob, carol, dev, minter]) => {
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

        await this.dino.setOfferingPercentage('0', {from : dev});
    });

    it('should create nft properly', async () => {
        let res = await this.controller.newNFT(
            "0x0000000000000000000000000000000000000000",
            '0',
            "newNFT",
            "newNFT",
            "100000000",
            "100",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: dev, value: "100000000000000000"});
        console.log(res.receipt.gasUsed);

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');

        assert.equal((await this.dino721.ownerOf('1')).valueOf(), this.mapper.address);
        assert.equal(tokenInfo.owner.valueOf(), this.offer.address);


        await this.test721.mint(dev, '1', {from : dev});
        await this.test721.approve(this.controller.address, '1', {from : dev});
        res = await this.controller.newNFT(
            this.test721.address,
            '1',
            "existingNFT",
            "existingNFT",
            "100000000",
            "100",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: dev, value: "100000000000000000"});
        console.log(res.receipt.gasUsed);

        tokenInfo = await this.mapper.tokenInfos(this.test721.address, '1');

        assert.equal((await this.test721.ownerOf('1')).valueOf(), this.mapper.address);
        assert.equal(tokenInfo.owner.valueOf(), this.offer.address);
    });

    it('should refresh owner properly', async () => {
        await this.controller.newNFT(
            "0x0000000000000000000000000000000000000000",
            '0',
            "newNFT",
            "newNFT",
            "100000000",
            "100",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: dev, value: "100000000000000000"});

        await time.advanceBlockTo('100');

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        let dino20 = new web3.eth.Contract(KIP7.abi, tokenInfo.dino20.valueOf());

        await this.offer.claimOwner(tokenInfo.dino20.valueOf(), {from : dev});

        let res = await dino20.methods.transfer(alice, "51000000").send({from: dev, gas: 150000});
        console.log(res.gasUsed);
        tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(tokenInfo.owner.valueOf(), alice);

        await dino20.methods.transfer(bob, "11000000").send({from: alice, gas: 150000});
        tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(tokenInfo.owner.valueOf(), "0x0000000000000000000000000000000000000000");

        await dino20.methods.transfer(dev, "11000000").send({from: bob, gas: 150000});
        tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(tokenInfo.owner.valueOf(), dev);
    });

    it('should exit properly', async () => {
        await this.controller.newNFT(
            "0x0000000000000000000000000000000000000000",
            '0',
            "newNFT",
            "newNFT",
            "100000000",
            "200",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: dev, value: "100000000000000000"});

        await time.advanceBlockTo('200');

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        await this.offer.claimOwner(tokenInfo.dino20.valueOf(), {from : dev});

        let res = await this.controller.exit(tokenInfo.dino20.valueOf(), {from : dev});
        console.log(res.receipt.gasUsed);
        assert.equal((await this.dino721.ownerOf('1')).valueOf(), dev);

    });

});