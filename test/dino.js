const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Dino = artifacts.require('Dino');

contract('Dino test', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.dino = await Dino.new(dev, dev, {from: dev});
    });

    it('should set offering percentage properly', async () => {
        await this.dino.setOfferingPercentage('1', {from: dev});
        assert.equal((await this.dino.offeringPercentage()).valueOf(), '1');
    });

    it('should set own percentage properly', async () => {
        await this.dino.setOwnPercentage('610000000000000000', {from: dev});
        assert.equal((await this.dino.ownPercentage()).valueOf(), '610000000000000000');
    });

    it('should set fee percentage properly', async () => {
        await this.dino.setFeePercentage('1', {from: dev});
        assert.equal((await this.dino.feePercentage()).valueOf(), '1');
    });

    it('should set new nft fee properly', async () => {
        await this.dino.setNewNFTFee('1', {from: dev});
        assert.equal((await this.dino.newNFTFee()).valueOf(), '1');
    });

    it('should set exit percentage properly', async () => {
        await this.dino.setExitPercentage('999999999999999999', {from: dev});
        assert.equal((await this.dino.exitPercentage()).valueOf(), '999999999999999999');
    });

    it('should set minter properly', async () => {
        await this.dino.setMinter(alice, {from: dev});
        assert.equal((await this.dino.minters(alice)).valueOf(), true);
    });

    it('should set admin properly', async () => {
        await this.dino.setAdmin(alice, {from: dev});
        assert.equal((await this.dino.admin()).valueOf(), alice);
    });

    it('should set receiver properly', async () => {
        await this.dino.setReceiver(alice, {from: dev});
        assert.equal((await this.dino.receiver()).valueOf(), alice);
    });

    it('should set controller properly', async () => {
        await this.dino.setController(alice, {from: dev});
        assert.equal((await this.dino.controller()).valueOf(), alice);
    });

    it('should set mapper properly', async () => {
        await this.dino.setMapper(alice, {from: dev});
        assert.equal((await this.dino.mapper()).valueOf(), alice);
    });

    it('should set staker properly', async () => {
        await this.dino.setStaker(alice, {from: dev});
        assert.equal((await this.dino.staker()).valueOf(), alice);
    });

    it('should set offer properly', async () => {
        await this.dino.setOffer(alice, {from: dev});
        assert.equal((await this.dino.offer()).valueOf(), alice);
    });

    it('should set distributor properly', async () => {
        await this.dino.setDistributor(alice, {from: dev});
        assert.equal((await this.dino.distributor()).valueOf(), alice);
    });

    it('should set dino 721 properly', async () => {
        await this.dino.setDino721(alice, {from: dev});
        assert.equal((await this.dino.dino721()).valueOf(), alice);
    });


});