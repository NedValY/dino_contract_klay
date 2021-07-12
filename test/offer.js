const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Mapper = artifacts.require('Mapper');
const Offer = artifacts.require('Offer');
const Dino = artifacts.require('Dino');
const MockKIP7 = artifacts.require('MockKIP7');
const MockKIP17 = artifacts.require('MockKIP17');

contract('Offer test', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.dino = await Dino.new(dev, dev, {from: dev});

        this.offer = await Offer.new(this.dino.address, {from: dev});
        this.mapper = await Mapper.new(this.dino.address, {from: dev});

        await this.dino.setController(minter, {from: dev});
        await this.dino.setStaker(dev, {from: dev});
        await this.dino.setMapper(this.mapper.address, {from: dev});

        await this.dino.setMinter(minter, {from: dev});

        await this.dino.mint(alice, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: alice});
        await this.dino.mint(bob, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: bob});
        await this.dino.mint(carol, '10000', {from: minter});
        await this.dino.approve(this.offer.address, '1000000000', {from: carol});

        this.reward = await MockKIP7.new('Reward', 'Reward', '1000000', { from: minter });

        await this.reward.approve(this.offer.address, '1000000000000', {from: minter});

        this.test721 = await MockKIP17.new({from: minter});
        await this.test721.mint(minter, '1', {from : minter});
        await this.test721.approve(this.mapper.address, '1', {from :minter});

        await this.mapper.newNFT(
            this.test721.address,
            "1",
            this.reward.address,
            dev,
            {from: minter});
    });

    it('should create offer properly', async () => {
        let res = await this.offer.newOffering(
            this.reward.address,
            dev,
            "100",
            "1000000",
            "100000",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: minter});
        console.log(res.receipt.gasUsed);

        let poolInfo = await this.offer.poolInfos(this.reward.address);
        assert.equal(poolInfo.owner.valueOf(), dev);
        assert.equal(poolInfo.totalAmount.valueOf(), '0');
        assert.equal(poolInfo.endBlock.valueOf(), '100');
        assert.equal(poolInfo.offeringAmount.valueOf(), '100000');
    });

    it('should deposit properly', async () => {
        await this.offer.newOffering(
            this.reward.address,
            dev,
            "100",
            "1000000",
            "100000",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: minter});

        let res = await this.offer.deposit(this.reward.address, '100', {from: alice});
        console.log(res.receipt.gasUsed);
        await this.offer.deposit(this.reward.address, '200', {from: bob});
        await this.offer.deposit(this.reward.address, '300', {from: carol});
        let poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '600');
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '100');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '200');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '300');

        await this.offer.deposit(this.reward.address, '300', {from: alice});
        await this.offer.deposit(this.reward.address, '200', {from: bob});
        await this.offer.deposit(this.reward.address, '100', {from: carol});
        poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '1200');
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '400');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '400');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '400');

        await time.advanceBlockTo('100');

        await expectRevert(
            this.offer.deposit(this.reward.address, '300', {from: alice}),
            "Dino: over"
        );
        await expectRevert(
            this.offer.deposit(this.reward.address, '300', {from: bob}),
            "Dino: over"
        );
        await expectRevert(
            this.offer.deposit(this.reward.address, '300', {from: carol}),
            "Dino: over"
        );
    });

    it('should withdraw properly', async () => {
        await this.offer.newOffering(
            this.reward.address,
            dev,
            "200",
            "1000000",
            "100000",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: minter});

        await this.offer.deposit(this.reward.address, '100', {from: alice});
        await this.offer.deposit(this.reward.address, '200', {from: bob});
        await this.offer.deposit(this.reward.address, '300', {from: carol});
        await this.offer.deposit(this.reward.address, '300', {from: alice});
        await this.offer.deposit(this.reward.address, '200', {from: bob});
        await this.offer.deposit(this.reward.address, '100', {from: carol});

        let res = await this.offer.withdraw(this.reward.address, '300', {from: alice});
        console.log(res.receipt.gasUsed);
        await this.offer.withdraw(this.reward.address, '200', {from: bob});
        await this.offer.withdraw(this.reward.address, '100', {from: carol});
        let poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '600');
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '100');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '200');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '300');

        await this.offer.withdraw(this.reward.address, '100', {from: alice});
        await this.offer.withdraw(this.reward.address, '200', {from: bob});
        await this.offer.withdraw(this.reward.address, '300', {from: carol});
        poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '0');

        await time.advanceBlockTo('200');

        await expectRevert(
            this.offer.deposit(this.reward.address, '0', {from: alice}),
            "Dino: over"
        );
        await expectRevert(
            this.offer.deposit(this.reward.address, '0', {from: bob}),
            "Dino: over"
        );
        await expectRevert(
            this.offer.deposit(this.reward.address, '0', {from: carol}),
            "Dino: over"
        );

    });

    it('should claim properly', async () => {
        await this.offer.newOffering(
            this.reward.address,
            dev,
            "300",
            "1000000",
            "100000",
            ["0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"],
            ["0","0","0","0"],
            {from: minter});

        await this.offer.deposit(this.reward.address, '2000', {from: alice});
        await this.offer.deposit(this.reward.address, '3000', {from: bob});
        await this.offer.deposit(this.reward.address, '5000', {from: carol});

        await expectRevert(
            this.offer.claim(this.reward.address, {from: alice}),
            "Dino: not over"
        );
        await expectRevert(
            this.offer.claim(this.reward.address, {from: bob}),
            "Dino: not over"
        );
        await expectRevert(
            this.offer.claim(this.reward.address, {from: carol}),
            "Dino: not over"
        );

        await time.advanceBlockTo('300');

        let res = await this.offer.claim(this.reward.address, {from: alice});
        console.log(res.receipt.gasUsed);
        let poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '8000');
        assert.equal(poolInfo.offeringAmount.valueOf(), '80000')
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '3000');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '5000');

        assert.equal((await this.reward.balanceOf(alice)).valueOf(), '20000');
        assert.equal((await this.dino.balanceOf(alice)).valueOf(), '9998');
        assert.equal((await this.dino.balanceOf(dev)).valueOf(), '2');

        await this.offer.claim(this.reward.address, {from: bob});
        poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '5000');
        assert.equal(poolInfo.offeringAmount.valueOf(), '50000')
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '5000');

        assert.equal((await this.reward.balanceOf(bob)).valueOf(), '30000');
        assert.equal((await this.dino.balanceOf(bob)).valueOf(), '9997');
        assert.equal((await this.dino.balanceOf(dev)).valueOf(), '5');

        await this.offer.claim(this.reward.address, {from: carol});
        poolInfo = await this.offer.poolInfos(this.reward.address);

        assert.equal(poolInfo.totalAmount.valueOf(), '0');
        assert.equal(poolInfo.offeringAmount.valueOf(), '0')
        assert.equal((await this.offer.userAmounts(this.reward.address, alice)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, bob)).valueOf(), '0');
        assert.equal((await this.offer.userAmounts(this.reward.address, carol)).valueOf(), '0');

        assert.equal((await this.reward.balanceOf(carol)).valueOf(), '50000');
        assert.equal((await this.dino.balanceOf(carol)).valueOf(), '9995');
        assert.equal((await this.dino.balanceOf(dev)).valueOf(), '10');

    });

    it('should claim owner properly', async () => {
        await this.offer.newOffering(
            this.reward.address,
            dev,
            "400",
            "1000000",
            "100000",
            ["0x0000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000002",
                "0x0000000000000000000000000000000000000003",
                "0x0000000000000000000000000000000000000004"],
            ["100000000000000000",
                "100000000000000000",
                "100000000000000000",
                "100000000000000000"],
            {from: minter});

        await this.offer.deposit(this.reward.address, '2000', {from: alice});
        await this.offer.deposit(this.reward.address, '3000', {from: bob});
        await this.offer.deposit(this.reward.address, '5000', {from: carol});

        await expectRevert(
            this.offer.claimOwner(this.reward.address, {from: dev}),
            "Dino: not over"
        );

        await time.advanceBlockTo('400');

        await this.offer.claim(this.reward.address, {from: alice});
        await this.offer.claim(this.reward.address, {from: bob});
        await this.offer.claim(this.reward.address, {from: carol});

        let res = await this.offer.claimOwner(this.reward.address, {from: dev});
        console.log(res.receipt.gasUsed);

        assert.equal((await this.reward.balanceOf(this.offer.address)).valueOf(), '0');
        assert.equal((await this.reward.balanceOf(dev)).valueOf(), '744000');
        assert.equal((await this.reward.balanceOf("0x0000000000000000000000000000000000000001")).valueOf(), '39000');
        assert.equal((await this.reward.balanceOf("0x0000000000000000000000000000000000000002")).valueOf(), '39000');
        assert.equal((await this.reward.balanceOf("0x0000000000000000000000000000000000000003")).valueOf(), '39000');
        assert.equal((await this.reward.balanceOf("0x0000000000000000000000000000000000000004")).valueOf(), '39000');

    });
});