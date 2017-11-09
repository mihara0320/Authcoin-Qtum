var AuthCoinContract = artifacts.require("./AuthCoin.sol");
var BytesUtils = artifacts.require("./utils/BytesUtils.sol");
var RsaVerify = artifacts.require("./signatures/RsaVerify.sol");
var ECVerify = artifacts.require("./signatures/ECVerify.sol");

module.exports = function(deployer) {
  deployer.deploy([BytesUtils, RsaVerify, ECVerify]);
  deployer.link(RsaVerify, AuthCoinContract);
  deployer.link(ECVerify, AuthCoinContract);
  deployer.link(BytesUtils, AuthCoinContract);
  deployer.deploy([AuthCoinContract]);
};
