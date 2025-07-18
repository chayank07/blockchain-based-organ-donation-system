import React, { useState, useEffect } from "react";
import Web3 from "web3";
import OrganDonationABI from "./OrganDonationABI.json";
import "./OrganDonationApp.css";

// Constants
const CONTRACT_ADDRESS = "0x37601c008FF4d292b654249DF3df1C9107F6C8FF";
const HOSPITAL_ADDRESS = "0x6801fE16cCd31E5A23692940851B97Ab2D411A0F";
const ADMIN_ADDRESS = "0xC417DE948427eCACf33C7681bF43aE843afE82Fb";
const DONOR_STORAGE_ADDRESS = "0xb0DE9570B4bB8AFE9fAAa9EB76212D30042Ff762";
const RECIPIENT_STORAGE_ADDRESS = "0x7031F09Df4d4ADbA89b462E50C81dd9Bec999b1D";

const thStyle = {
    border: "1px solid #999",
    padding: "8px",
    backgroundColor: "#d9edf7",
    textAlign: "left"
};

const tdStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    backgroundColor: "#f9f9f9"
};

const highlightStyle = {
    backgroundColor: "#fbe9e7", 
};

const showToast = (message, type = "info") => {
    const bgColor = type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3";
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

const OrganDonationApp = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [donors, setDonors] = useState([]);
    const [recipients, setRecipients] = useState([]);

    const [donorData, setDonorData] = useState({ name: "", age: "", bloodType: "", organ: "", tissueType: "" });
    const [recipientData, setRecipientData] = useState({ name: "", age: "", bloodType: "", neededOrgan: "", tissueType: "", urgencyLevel: "" });
    const [hospitalData, setHospitalData] = useState({ address: "", name: "", location: "", contactInfo: "" });

    const totalMatches = recipients.filter((r) => r.hasReceived).length;
    const [matchData, setMatchData] = useState({ donorIndex: "", recipientIndex: "" });
    const [retrievalIndex, setRetrievalIndex] = useState({ donorIndex: "", recipientIndex: "" });
    const [urgencyUpdate, setUrgencyUpdate] = useState({ index: "", newLevel: "" });

    const [donorSearch, setDonorSearch] = useState('');
    const [recipientSearch, setRecipientSearch] = useState('');
    const [sortUrgency, setSortUrgency] = useState('');
    const [donorFilters, setDonorFilters] = useState({ name: '', bloodType: '', organ: '', tissueType: '' });
    const [recipientFilters, setRecipientFilters] = useState({ name: '', bloodType: '', organ: '', tissueType: '', urgencyLevel: '' });
    


    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3Instance.eth.getAccounts();
                setAccount(accounts[0]);
                const contractInstance = new web3Instance.eth.Contract(OrganDonationABI.abi, CONTRACT_ADDRESS);
                setContract(contractInstance);
                fetchData(contractInstance);
            }
        };
        initWeb3();
    }, []);

    const fetchData = async (contract) => {
        try {
            const donorsList = await contract.methods.getDonorList().call({ from: HOSPITAL_ADDRESS });
            const recipientsList = await contract.methods.getRecipientList().call({ from: HOSPITAL_ADDRESS });

            setDonors(donorsList.map(donor => ({
                ...donor,
                age: donor.age.toString(),
                isAvailable: donor.isAvailable
            })));

            setRecipients(recipientsList.map(recipient => ({
                ...recipient,
                age: recipient.age.toString(),
                urgencyLevel: recipient.urgencyLevel.toString(),
                hasReceived: recipient.hasReceived
            })));
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const filteredDonors = donors.filter(donor =>
        donor.name.toLowerCase().includes(donorSearch.toLowerCase()) &&
        donor.bloodType.toLowerCase().includes(donorFilters.bloodType.toLowerCase()) &&
        donor.organ.toLowerCase().includes(donorFilters.organ.toLowerCase()) &&
        donor.tissueType.toLowerCase().includes(donorFilters.tissueType.toLowerCase())
      );
    
      const filteredRecipients = recipients
        .filter(recipient =>
          recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) &&
          recipient.bloodType.toLowerCase().includes(recipientFilters.bloodType.toLowerCase()) &&
          recipient.neededOrgan.toLowerCase().includes(recipientFilters.organ.toLowerCase()) &&
          recipient.tissueType.toLowerCase().includes(recipientFilters.tissueType.toLowerCase()) &&
          recipient.urgencyLevel.toString().includes(recipientFilters.urgencyLevel.toString())
        )
        .sort((a, b) => {
          if (!sortUrgency) return 0;
          return sortUrgency === "asc" ? a.urgencyLevel - b.urgencyLevel : b.urgencyLevel - a.urgencyLevel;
        });
      
    const registerHospital = async () => {
        try {
            await contract.methods.registerHospital(hospitalData.address, hospitalData.name, hospitalData.location, hospitalData.contactInfo).send({ from: account });
            showToast("Hospital registered successfully", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Registration failed:", error.message);
            showToast("Registration failed", "error");
        }
    };

    const registerDonor = async () => {
        try {
            await contract.methods
                .registerDonor(donorData.name, donorData.age, donorData.bloodType, donorData.organ, donorData.tissueType)
                .send({ from: DONOR_STORAGE_ADDRESS, gas: 500000 });

            showToast("Donor registered successfully", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Donor registration failed:", error.message);
            showToast("Donor registration failed", "error");
        }
    };

    const registerRecipient = async () => {
        try {
            await contract.methods
                .registerRecipient(recipientData.name, recipientData.age, recipientData.bloodType, recipientData.neededOrgan, recipientData.tissueType, recipientData.urgencyLevel)
                .send({ from: RECIPIENT_STORAGE_ADDRESS, gas: 500000 });

            showToast("Recipient registered successfully", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Recipient registration failed:", error.message);
            showToast("Recipient registration failed", "error");
        }
    };

    const matchOrgan = async () => {
        try {
            await contract.methods.matchOrgan(matchData.donorIndex, matchData.recipientIndex).send({ from: HOSPITAL_ADDRESS });
            showToast("Organ matched successfully", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Organ match failed:", error.message);
            showToast("Compatibility not found", "error");
        }
    };

    const confirmOrganRetrieval = async () => {
        try {
            await contract.methods.confirmOrganRetrieval(retrievalIndex.donorIndex, retrievalIndex.recipientIndex).send({ from: HOSPITAL_ADDRESS, gas: 200000 });
            showToast("Organ retrieval confirmed", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Confirmation failed:", error.message);
            showToast("Retrieval confirmation failed", "error");
        }
    };

    const updateUrgency = async () => {
        try {
            await contract.methods.updateUrgencyLevel(parseInt(urgencyUpdate.index), parseInt(urgencyUpdate.newLevel)).send({ from: HOSPITAL_ADDRESS, gas: 200000 });
            showToast("Urgency level updated", "success");
            fetchData(contract);
        } catch (error) {
            console.error("Urgency update failed:", error.message);
            showToast("Urgency update failed", "error");
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Blockchain Based Organ Donation System</h1>
            <p><strong>Connected Wallet:</strong> {account}</p>

            {account === ADMIN_ADDRESS && (
                <div>
                    <h2>Register Hospital</h2>
                    <input type="text" placeholder="Hospital Address" onChange={(e) => setHospitalData({ ...hospitalData, address: e.target.value })} />
                    <input type="text" placeholder="Hospital Name" onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })} />
                    <input type="text" placeholder="Location" onChange={(e) => setHospitalData({ ...hospitalData, location: e.target.value })} />
                    <input type="text" placeholder="Contact Info" onChange={(e) => setHospitalData({ ...hospitalData, contactInfo: e.target.value })} />
                    <button onClick={registerHospital}>Register Hospital</button>
                </div>
            )}

            {account === DONOR_STORAGE_ADDRESS && (
                <div>
                    <h2>Register Donor</h2>
                    <input type="text" placeholder="Name" onChange={(e) => setDonorData({ ...donorData, name: e.target.value })} />
                    <input type="number" placeholder="Age" onChange={(e) => setDonorData({ ...donorData, age: e.target.value })} />
                    <input type="text" placeholder="Blood Type" onChange={(e) => setDonorData({ ...donorData, bloodType: e.target.value })} />
                    <input type="text" placeholder="Organ" onChange={(e) => setDonorData({ ...donorData, organ: e.target.value })} />
                    <input type="text" placeholder="Tissue Type" onChange={(e) => setDonorData({ ...donorData, tissueType: e.target.value })} />
                    <button onClick={registerDonor}>Register Donor</button>
                </div>
            )}

            {account === RECIPIENT_STORAGE_ADDRESS && (
                <div>
                    <h2>Register Recipient</h2>
                    <input type="text" placeholder="Name" onChange={(e) => setRecipientData({ ...recipientData, name: e.target.value })} />
                    <input type="number" placeholder="Age" onChange={(e) => setRecipientData({ ...recipientData, age: e.target.value })} />
                    <input type="text" placeholder="Blood Type" onChange={(e) => setRecipientData({ ...recipientData, bloodType: e.target.value })} />
                    <input type="text" placeholder="Needed Organ" onChange={(e) => setRecipientData({ ...recipientData, neededOrgan: e.target.value })} />
                    <input type="text" placeholder="Tissue Type" onChange={(e) => setRecipientData({ ...recipientData, tissueType: e.target.value })} />
                    <input type="number" placeholder="Urgency Level" onChange={(e) => setRecipientData({ ...recipientData, urgencyLevel: e.target.value })} />
                    <button onClick={registerRecipient}>Register Recipient</button>
                </div>
            )}

{account === HOSPITAL_ADDRESS && (
        <>
          {/* Dashboard Stats */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Donors</h3>
              <p>{donors.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Recipients</h3>
              <p>{recipients.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Matches Made</h3>
              <p>{totalMatches}</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="action-cards">
            <div className="action-card">
              <h3>Match Organ</h3>
              <input type="number" placeholder="Donor Index" onChange={(e) => setMatchData({ ...matchData, donorIndex: e.target.value })} />
              <input type="number" placeholder="Recipient Index" onChange={(e) => setMatchData({ ...matchData, recipientIndex: e.target.value })} />
              <button onClick={matchOrgan}>Match</button>
            </div>

            <div className="action-card">
              <h3>Confirm Organ Retrieval</h3>
              <input type="number" placeholder="Donor Index" onChange={(e) => setRetrievalIndex({ ...retrievalIndex, donorIndex: e.target.value })} />
              <input type="number" placeholder="Recipient Index" onChange={(e) => setRetrievalIndex({ ...retrievalIndex, recipientIndex: e.target.value })} />
              <button onClick={confirmOrganRetrieval}>Confirm</button>
            </div>

            <div className="action-card">
              <h3>Update Urgency Level</h3>
              <input type="number" placeholder="Recipient Index" onChange={(e) => setUrgencyUpdate({ ...urgencyUpdate, index: e.target.value })} />
              <input type="number" placeholder="New Urgency Level" onChange={(e) => setUrgencyUpdate({ ...urgencyUpdate, newLevel: e.target.value })} />
              <button onClick={updateUrgency}>Update</button>
            </div>
          </div>

          
          {/* Donor Table */}
          <h2>Donors List</h2>
          <input
            type="text"
            placeholder="Search Donor by Name"
            value={donorSearch}
            onChange={(e) => setDonorSearch(e.target.value)}
          />
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Blood Type<br /><input onChange={(e) => setDonorFilters({ ...donorFilters, bloodType: e.target.value })} /></th>
                <th>Organ<br /><input onChange={(e) => setDonorFilters({ ...donorFilters, organ: e.target.value })} /></th>
                <th>Tissue Type<br /><input onChange={(e) => setDonorFilters({ ...donorFilters, tissueType: e.target.value })} /></th>
                <th>Organ Available</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonors.map((donor, index) => (
                <tr key={index} className={!donor.isAvailable ? "highlight-row" : ""}>
                  <td>{donor.name}</td>
                  <td>{donor.age}</td>
                  <td>{donor.bloodType}</td>
                  <td>{donor.organ}</td>
                  <td>{donor.tissueType}</td>
                  <td>
                    <span
                    style={{
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: donor.isAvailable ? '#4CAF50' : '#f44336'
                    }}
                    >
                        {donor.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        </td>


                </tr>
              ))}
            </tbody>
          </table>

          {/* Recipient Table */}
          <h2>Recipients List</h2>
          <input
            type="text"
            placeholder="Search Recipient by Name"
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
          />
          <label>
            Sort by Urgency:
            <select value={sortUrgency} onChange={(e) => setSortUrgency(e.target.value)}>
              <option value="">None</option>
              <option value="asc">Low to High</option>
              <option value="desc">High to Low</option>
            </select>
          </label>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Blood Type<br /><input onChange={(e) => setRecipientFilters({ ...recipientFilters, bloodType: e.target.value })} /></th>
                <th>Needed Organ<br /><input onChange={(e) => setRecipientFilters({ ...recipientFilters, organ: e.target.value })} /></th>
                <th>Tissue Type<br /><input onChange={(e) => setRecipientFilters({ ...recipientFilters, tissueType: e.target.value })} /></th>
                <th>Urgency Level<br /><input onChange={(e) => setRecipientFilters({ ...recipientFilters, urgencyLevel: e.target.value })} /></th>
                <th>Has Received</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipients.map((recipient, index) => (
                <tr key={index} className={recipient.hasReceived ? "highlight-row" : ""}>
                  <td>{recipient.name}</td>
                  <td>{recipient.age}</td>
                  <td>{recipient.bloodType}</td>
                  <td>{recipient.neededOrgan}</td>
                  <td>{recipient.tissueType}</td>
                  <td>{recipient.urgencyLevel}</td>
                  <td>
                    <span
                    style={{
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: recipient.hasReceived ? '#4CAF50' : '#f44336'
                    }}
                    >
                        {recipient.hasReceived ? 'Received' : 'Waiting'}
                        </span>
                        </td>

                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default OrganDonationApp;
