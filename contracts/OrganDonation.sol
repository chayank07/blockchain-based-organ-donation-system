// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

contract OrganDonation {
    struct Donor {
        uint id;
        string name;
        uint age;
        string bloodType;
        string organ;
        string tissueType;
        bool isAvailable;
    }

    struct Recipient {
        uint id;
        string name;
        uint age;
        string bloodType;
        string neededOrgan;
        string tissueType;
        uint urgencyLevel;
        bool hasReceived;
    }

    struct Hospital {
        uint id;
        string name;
        string location;
        string contactInfo;
        bool isApproved;
    }

    address public admin;
    uint public hospitalCount;
    uint public donorCount;
    uint public recipientCount;

    mapping(address => Hospital) public hospitals;
    mapping(address => Donor[]) public donors;        
    mapping(address => Recipient[]) public recipients; 
    address[] public hospitalAddresses;
    address public donorStorageAddress;
    address public recipientStorageAddress;

    event HospitalRegistered(uint hospitalId, string name, string location, string contactInfo);
    event DonorRegistered(address donorAccount, string name, string organ);
    event RecipientRegistered(address recipientAccount, string name, string neededOrgan, uint urgencyLevel);
    event OrganMatched(address donorAccount, uint donorIndex, address recipientAccount, uint recipientIndex, string organ);
    event OrganRetrieved(address donorAccount, uint donorIndex, address recipientAccount, uint recipientIndex, string organ);
    event UrgencyUpdated(address recipientAccount, uint recipientIndex, uint oldUrgency, uint newUrgency);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyHospital() {
        require(hospitals[msg.sender].isApproved, "Only hospitals can access this data");
        _;
    }

    constructor(address _admin, address _donorStorage, address _recipientStorage) public {
        admin = _admin;
        donorStorageAddress = _donorStorage;
        recipientStorageAddress = _recipientStorage;
    }

    function registerHospital(address _hospitalAddress, string memory _name, string memory _location, string memory _contactInfo) public onlyAdmin {
        require(!hospitals[_hospitalAddress].isApproved, "Hospital already registered");

        hospitalCount++;
        hospitals[_hospitalAddress] = Hospital(hospitalCount, _name, _location, _contactInfo, true);
        hospitalAddresses.push(_hospitalAddress);

        emit HospitalRegistered(hospitalCount, _name, _location, _contactInfo);
    }

    function registerDonor(string memory _name, uint _age, string memory _bloodType, string memory _organ, string memory _tissueType) public {
        require(msg.sender == donorStorageAddress, "Only designated donor account can register donors");

        donorCount++;
        donors[msg.sender].push(Donor(donorCount, _name, _age, _bloodType, _organ, _tissueType, true));

        emit DonorRegistered(msg.sender, _name, _organ);
    }

    function registerRecipient(string memory _name, uint _age, string memory _bloodType, string memory _neededOrgan, string memory _tissueType, uint _urgencyLevel) public {
        require(msg.sender == recipientStorageAddress, "Only designated recipient account can register recipients");
        require(_urgencyLevel >= 1 && _urgencyLevel <= 5, "Urgency level must be between 1 and 5");

        recipientCount++;
        recipients[msg.sender].push(Recipient(recipientCount, _name, _age, _bloodType, _neededOrgan, _tissueType, _urgencyLevel, false));

        emit RecipientRegistered(msg.sender, _name, _neededOrgan, _urgencyLevel);
    }

    function matchOrgan(uint donorIndex, uint recipientIndex) public onlyHospital {
        require(donorIndex < donors[donorStorageAddress].length, "Invalid donor index");
        require(recipientIndex < recipients[recipientStorageAddress].length, "Invalid recipient index");

        Donor storage donor = donors[donorStorageAddress][donorIndex];
        Recipient storage recipient = recipients[recipientStorageAddress][recipientIndex];

        require(donor.isAvailable, "Donor not available");
        require(!recipient.hasReceived, "Recipient already received an organ");
        require(
            keccak256(abi.encodePacked(donor.organ)) == keccak256(abi.encodePacked(recipient.neededOrgan)),
            "Organ type mismatch"
        );
        require(
            keccak256(abi.encodePacked(donor.tissueType)) == keccak256(abi.encodePacked(recipient.tissueType)),
            "Tissue type mismatch"
        );

        donor.isAvailable = false;
        recipient.hasReceived = true;

        emit OrganMatched(donorStorageAddress, donorIndex, recipientStorageAddress, recipientIndex, donor.organ);
    }

    function confirmOrganRetrieval(uint donorIndex, uint recipientIndex) public onlyHospital {
        require(recipientIndex < recipients[recipientStorageAddress].length, "Invalid recipient index");
        require(donors[donorStorageAddress][donorIndex].isAvailable == false, "Organ not yet matched");

        emit OrganRetrieved(donorStorageAddress, donorIndex, recipientStorageAddress, recipientIndex, donors[donorStorageAddress][donorIndex].organ);
    }

    function updateUrgencyLevel(uint recipientIndex, uint _newUrgency) public {
        require(recipientIndex < recipients[recipientStorageAddress].length, "Invalid recipient index");
        require(_newUrgency >= 1 && _newUrgency <= 5, "Urgency level must be between 1 and 5");

        uint oldUrgency = recipients[recipientStorageAddress][recipientIndex].urgencyLevel;
        recipients[recipientStorageAddress][recipientIndex].urgencyLevel = _newUrgency;

        emit UrgencyUpdated(recipientStorageAddress, recipientIndex, oldUrgency, _newUrgency);
    }

    function getDonorList() public view onlyHospital returns (Donor[] memory) {
        return donors[donorStorageAddress];
    }

    function getRecipientList() public view onlyHospital returns (Recipient[] memory) {
        return recipients[recipientStorageAddress];
    }

    function getHospitalList() public view returns (address[] memory) {
        return hospitalAddresses;
    }
}
