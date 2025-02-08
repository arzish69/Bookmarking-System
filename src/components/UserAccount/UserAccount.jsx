import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore"; // Firestore imports
import { useParams } from "react-router-dom"; // Import useParams from react-router-dom
import { auth, db } from "../../firebaseConfig"; // Import Firebase config
import { onAuthStateChanged } from "firebase/auth"; // Import auth state change listener
import MainNavbar from "../../components/navbar";

const UserAccount = () => {
  const [activeTab, setActiveTab] = useState("account-general"); // Set default tab
  const [username, setUsername] = useState(""); // State to store the current user's username
  const [name, setName] = useState(""); // State to store the current user's name
  const [email, setEmail] = useState(""); // State to store the current user's email
  const [company, setCompany] = useState("Company Ltd."); // State to store company name

  const { userId } = useParams(); // Get the userId from URL parameters

  // Function to fetch the user's data from Firestore
  const fetchUserData = async (id) => {
    try {
      const userDoc = await getDoc(doc(db, "users", id)); // Reference to user document in Firestore
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUsername(userData.username || ""); // Set the username
        setName(userData.name || ""); // Set the name
        setEmail(userData.email || ""); // Set the email
        setCompany(userData.company || ""); // Set the company name if it exists
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // UseEffect to fetch the data when the component mounts or when userId changes
  useEffect(() => {
    if (userId) {
      // Fetch the data for the user whose ID is in the URL
      fetchUserData(userId);
    } else {
      // If no userId is provided, listen for the auth state and fetch current user's data
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchUserData(user.uid); // Fetch data for logged-in user
        }
      });
      return () => unsubscribe(); // Cleanup the listener on component unmount
    }
  }, [userId]); // Dependency array includes userId

  return (
    <>
      <MainNavbar />
      <div className="container light-style flex-grow-1 container-p-y">
        <h4 className="font-weight-bold py-3 mb-4">Account settings</h4>

        <div className="card overflow-hidden">
          <div className="row no-gutters row-bordered row-border-light">
            {/* Sidebar with tabs */}
            <div className="col-md-3 pt-0">
              <div className="list-group list-group-flush account-settings-links">
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-general" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-general")}
                >
                  General
                </a>
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-change-password" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-change-password")}
                >
                  Change password
                </a>
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-info" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-info")}
                >
                  Info
                </a>
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-social-links" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-social-links")}
                >
                  Social links
                </a>
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-connections" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-connections")}
                >
                  Connections
                </a>
                <a
                  className={`list-group-item list-group-item-action ${
                    activeTab === "account-notifications" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("account-notifications")}
                >
                  Notifications
                </a>
              </div>
            </div>

            {/* Content for each tab */}
            <div className="col-md-9">
              <div className="tab-content">
                {activeTab === "account-general" && (
                  <div
                    className="tab-pane fade active show"
                    id="account-general"
                  >
                    <div className="card-body media align-items-center">
                      <img
                        src="https://bootdey.com/img/Content/avatar/avatar1.png"
                        alt=""
                        className="d-block ui-w-80"
                      />
                      <div className="media-body ml-4">
                        <label className="btn btn-outline-primary">
                          Upload new photo
                          <input
                            type="file"
                            className="account-settings-fileinput"
                          />
                        </label>{" "}
                        &nbsp;
                        <button
                          type="button"
                          className="btn btn-default md-btn-flat"
                        >
                          Reset
                        </button>
                        <div className="text-light small mt-1">
                          Allowed JPG, GIF or PNG. Max size of 800K
                        </div>
                      </div>
                    </div>
                    <hr className="border-light m-0" />
                    <div className="card-body">
                      <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control mb-1"
                          value={username}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input
                          type="text"
                          className="form-control mb-1"
                          value={email}
                        />
                        <div className="alert alert-warning mt-3">
                          Your email is not confirmed. Please check your inbox.
                          <br />
                          <a href="#">Resend confirmation</a>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Company</label>
                        <input
                          type="text"
                          className="form-control"
                          value={company} // Set value to company state
                          onChange={(e) => setCompany(e.target.value)} // Attach onChange handler for company input
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add the other tab content here as in your original code */}
                {/* ... */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserAccount;
