const OrganDonation = artifacts.require("OrganDonation");

module.exports = function (deployer, network, accounts) {
  const admin = accounts[0];  // Admin
  const donorStorage = accounts[3];  // Donor storage
  const recipientStorage = accounts[4];  // Recipient storage

  deployer.deploy(OrganDonation, admin, donorStorage, recipientStorage);
};

