const util = require('ethereumjs-util');
var AuthCoin = artifacts.require("AuthCoin");
var DummyVerifier = artifacts.require("signatures/DummyVerifier");
var EntityIdentityRecord = artifacts.require("EntityIdentityRecord");
var ChallengeRecord = artifacts.require("ChallengeRecord");
var ValidationAuthenticationEntry = artifacts.require("ValidationAuthenticationEntry");

contract('AuthCoin & ChallengeRecord', function (accounts) {

    let authCoin
    let eir1
    let eir2

    // EIR values
    let identifiers = [web3.fromAscii("test@mail.com"), web3.fromAscii("John Doe")]
    let content = web3.fromAscii("content")
    let content2 = web3.fromAscii("content2")
    let id = web3.sha3(content, {encoding: 'hex'})
    let id2 = web3.sha3(content2, {encoding: 'hex'})
    let contentType = util.bufferToHex(util.setLengthRight("dummy", 32))

    // CR values
    let challengeId = web3.fromAscii("challenge1")
    let vaeId = util.bufferToHex(util.setLengthRight("vae1", 32))


    let challengeType = web3.fromAscii("signing challenge")
    let challenge = web3.fromAscii("sign value 'HELLO'", 128)
    let verifierEirId
    let targetEirId
    let hash = web3.fromAscii("hash", 32)
    let signature = web3.fromAscii("signature", 128)

    beforeEach('setup contract for each test', async function () {
        authCoin = await AuthCoin.new(accounts[0])
        let dummyVerifier = await DummyVerifier.new(accounts[0])
        await authCoin.registerSignatureVerifier(dummyVerifier.address, contentType)

        await authCoin.registerEir(content, contentType, identifiers, hash, signature)
        await authCoin.registerEir(content2, contentType, identifiers, hash, signature)

        eir1 = EntityIdentityRecord.at(await authCoin.getEir(id))
        eir2 = EntityIdentityRecord.at(await authCoin.getEir(id2))
        verifierEirId = await eir1.getId()
        targetEirId = await eir2.getId()

    })

    it("should fail when challenge records is added using unknown verifier EIR", async function () {
        let success = false
        try {
            await authCoin.registerChallengeRecord(challengeId, vaeId, challengeType, challenge, web3.fromAscii("dummy", 32), targetEirId, hash, signature)
            success = true
        } catch (error) {}
        assert.isNotOk(success)
    })

    it("should fail when challenge records is added using unknown target EIR", async function () {
        let success = false
        try {
            await authCoin.registerChallengeRecord(challengeId, vaeId, challengeType, challenge, verifierEirId, web3.fromAscii("dummy", 32), hash, signature)
            success = true
        } catch (error) {}
        assert.isNotOk(success)
    })

    it("supports adding new challenge record", async function () {
        var vaeEvents = authCoin.LogNewVae({_from: web3.eth.coinbase}, {fromBlock: 0, toBlock: 'latest'});
        await authCoin.registerChallengeRecord(challengeId, vaeId, challengeType, challenge, verifierEirId, targetEirId, hash, signature)

        assert.equal(await authCoin.getVaeCount(), 1)

        let vae = ValidationAuthenticationEntry.at(await authCoin.getVae(vaeId))
        assert.equal(await vae.getVaeId(), vaeId)
        assert.equal(await vae.getChallengesCount(), 1)

        var event = vaeEvents.get()
        assert.equal(event.length, 1);
        assert.equal(event[0].args.id, vaeId)
    })

    it("querying VAE array by EIR id", async function () {
        var vaeEvents = authCoin.LogNewVae({_from: web3.eth.coinbase}, {fromBlock: 0, toBlock: 'latest'});
        await authCoin.registerChallengeRecord(challengeId, vaeId, challengeType, challenge, verifierEirId, targetEirId, hash, signature)

        assert.equal(await authCoin.getVaeCount(), 1)

        let vaeArray = await authCoin.getVaeArrayByEirId(verifierEirId);
        assert.equal(vaeArray.length, 1)

        let vaeArray2 = await authCoin.getVaeArrayByEirId(targetEirId);
        assert.equal(vaeArray2.length, 1)
        assert.equal(vaeArray[0], vaeArray2[0])

        var event = vaeEvents.get()
        assert.equal(event[0].args.vaeAddress, vaeArray[0])
    })

    it("querying VAE array by EIR that doesn't have any challenges return empty array", async function () {
        let vaeArray = await authCoin.getVaeArrayByEirId(verifierEirId);
        assert.equal(vaeArray.length, 0)
    })

})