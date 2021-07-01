const { time, expectRevert } = require('@openzeppelin/test-helpers');

const Mapper = artifacts.require('Mapper');
const Dino = artifacts.require('Dino');
const Dino721 = artifacts.require('Dino721');
const MockKIP7 = artifacts.require('MockKIP7');

contract('Mapper test', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.dino = await Dino.new(dev, dev, {from: dev});

        this.dino721 = await Dino721.new(this.dino.address, {from : dev});
        await this.dino.setDino721(this.dino721.address, {from : dev});

        this.mapper = await Mapper.new(this.dino.address, {from: dev});
        await this.dino.setMapper(this.mapper.address, {from : dev});

        this.dino20 = await MockKIP7.new('dino20', 'dino20', '100000000', {from : dev});

        await this.dino.setController(dev, {from: dev});

        await this.dino721.mint(dev, '1', {from : dev});
        await this.dino721.approve(this.mapper.address, '1', {from : dev});
    });

    it('should create nft properly', async () => {
        let res = await this.mapper.newNFT(this.dino721.address, '1', this.dino20.address, dev, {from: dev});
        console.log(res.receipt.gasUsed);

        assert.equal((await this.dino721.ownerOf('1')).valueOf(), this.mapper.address);
        let nftInfo = await this.mapper.dino20ToNFTInfo(this.dino20.address);
        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(nftInfo.token.valueOf(), this.dino721.address);
        assert.equal(nftInfo.tokenId.valueOf(), '1');
        assert.equal(tokenInfo.dino20.valueOf(), this.dino20.address);
        assert.equal(tokenInfo.owner.valueOf(), dev);
    });

    it('should refresh owner properly', async () => {
        await this.mapper.newNFT(this.dino721.address, '1', this.dino20.address, dev, {from: dev});

        let res = await this.mapper.refreshOwner(this.dino20.address, alice, {from : dev});
        console.log(res.receipt.gasUsed);

        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(tokenInfo.owner.valueOf(), alice);
    });

    it('should exit properly', async () => {
        await this.mapper.newNFT(this.dino721.address, '1', this.dino20.address, dev, {from: dev});

        let res = await this.mapper.exit(this.dino20.address, dev, {from : dev});
        console.log(res.receipt.gasUsed);

        assert.equal((await this.dino721.ownerOf('1')).valueOf(), dev);
        let nftInfo = await this.mapper.dino20ToNFTInfo(this.dino20.address);
        let tokenInfo = await this.mapper.tokenInfos(this.dino721.address, '1');
        assert.equal(nftInfo.token.valueOf(), "0x0000000000000000000000000000000000000000");
        assert.equal(nftInfo.tokenId.valueOf(), '0');
        assert.equal(tokenInfo.dino20.valueOf(), "0x0000000000000000000000000000000000000000");
        assert.equal(tokenInfo.owner.valueOf(), "0x0000000000000000000000000000000000000000");


    });

});