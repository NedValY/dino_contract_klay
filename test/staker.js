const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Staker = artifacts.require('Staker');
const Dino = artifacts.require('Dino');

contract('Staker test', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.dino = await Dino.new(dev, dev, {from: dev});

        this.staker = await Staker.new(this.dino.address, {from: dev});
        await this.dino.setStaker(this.staker.address, {from: dev});

        await this.dino.setMinter(minter, {from : dev});
        await this.dino.mint(alice, '100', {from : minter});
        await this.dino.mint(bob, '100', {from : minter});
        await this.dino.mint(carol, '100', {from : minter});
    });

    it('should work properly', async () => {
        await this.dino.approve(this.staker.address, "100", {from : alice});
        await this.dino.approve(this.staker.address, "100", { from: bob });

        await this.staker.stake("20", {from : alice});
        await this.staker.stake("10", { from: bob })
        assert.equal((await this.staker.balanceOf(alice)).valueOf(), "20");
        assert.equal((await this.staker.balanceOf(bob)).valueOf(), "10");
        assert.equal((await this.dino.balanceOf(this.staker.address)).valueOf(), "30");

        await this.dino.transfer(this.staker.address, "20", { from: carol })

        await this.staker.stake("10", {from : alice})
        assert.equal((await this.staker.balanceOf(alice)).valueOf(), "26");
        assert.equal((await this.staker.balanceOf(bob)).valueOf(), "10");

        await this.staker.unstake("5", { from: bob });
        assert.equal((await this.staker.balanceOf(alice)).valueOf(), "26");
        assert.equal((await this.staker.balanceOf(bob)).valueOf(), "5");

        assert.equal((await this.dino.balanceOf(this.staker.address)).valueOf(), "52");
        assert.equal((await this.dino.balanceOf(alice)).valueOf(), "70");
        assert.equal((await this.dino.balanceOf(bob)).valueOf(), "98");
    });

});