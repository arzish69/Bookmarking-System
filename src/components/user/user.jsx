import React, { useState } from "react";
import MainNavbar from "../../main_pages/main_navbar";

const UserAccount = () => {
  const [activeTab, setActiveTab] = useState("account-general"); // Set default tab

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
                          value="nmaxwell"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value="Nelle Maxwell"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input
                          type="text"
                          className="form-control mb-1"
                          value="nmaxwell@mail.com"
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
                          value="Company Ltd."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account-change-password" && (
                  <div
                    className="tab-pane fade active show"
                    id="account-change-password"
                  >
                    <div className="card-body pb-2">
                      <div className="form-group">
                        <label className="form-label">Current password</label>
                        <input type="password" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New password</label>
                        <input type="password" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Repeat new password
                        </label>
                        <input type="password" className="form-control" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account-info" && (
                  <div className="tab-pane fade active show" id="account-info">
                    <div className="card-body pb-2">
                      <div className="form-group">
                        <label className="form-label">Bio</label>
                        <textarea
                          className="form-control"
                          rows="5"
                          defaultValue="Lorem ipsum dolor sit amet..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Birthday</label>
                        <input
                          type="text"
                          className="form-control"
                          value="May 3, 1995"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <select className="custom-select">
                          <option>USA</option>
                          <option selected>Canada</option>
                          <option>UK</option>
                          <option>Germany</option>
                          <option>France</option>
                        </select>
                      </div>
                    </div>
                    <hr className="border-light m-0" />
                    <div className="card-body pb-2">
                      <h6 className="mb-4">Contacts</h6>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value="+0 (123) 456 7891"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input type="text" className="form-control" value="" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account-social-links" && (
                  <div
                    className="tab-pane fade active show"
                    id="account-social-links"
                  >
                    <div className="card-body pb-2">
                      <div className="form-group">
                        <label className="form-label">Twitter</label>
                        <input
                          type="text"
                          className="form-control"
                          value="https://twitter.com/user"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Facebook</label>
                        <input
                          type="text"
                          className="form-control"
                          value="https://www.facebook.com/user"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn</label>
                        <input type="text" className="form-control" value="" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Instagram</label>
                        <input
                          type="text"
                          className="form-control"
                          value="https://www.instagram.com/user"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account-connections" && (
                  <div
                    className="tab-pane fade active show"
                    id="account-connections"
                  >
                    <div className="card-body">
                      <button type="button" className="btn btn-twitter">
                        Connect to <strong>Twitter</strong>
                      </button>
                    </div>
                    <hr className="border-light m-0" />
                    <div className="card-body">
                      <h5 className="mb-2">
                        <a
                          href="#"
                          className="float-right text-muted text-tiny"
                        >
                          <i className="ion ion-md-close" /> Remove
                        </a>
                        <i className="ion ion-logo-google text-google" />
                        You are connected to Google:
                      </h5>
                      nmaxwell@mail.com
                    </div>
                    <hr className="border-light m-0" />
                    <div className="card-body">
                      <button type="button" className="btn btn-facebook">
                        Connect to <strong>Facebook</strong>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "account-notifications" && (
                  <div
                    className="tab-pane fade active show"
                    id="account-notifications"
                  >
                    <div className="card-body pb-2">
                      <h6 className="mb-4">Activity</h6>
                      <div className="form-group">
                        <label className="switcher">
                          <input
                            type="checkbox"
                            className="switcher-input"
                            defaultChecked
                          />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Email me when someone comments on my post
                          </span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="switcher">
                          <input
                            type="checkbox"
                            className="switcher-input"
                            defaultChecked
                          />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Email me when someone answers on my forum thread
                          </span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="switcher">
                          <input type="checkbox" className="switcher-input" />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Email me when someone follows me
                          </span>
                        </label>
                      </div>
                    </div>
                    <hr className="border-light m-0" />
                    <div className="card-body pb-2">
                      <h6 className="mb-4">News</h6>
                      <div className="form-group">
                        <label className="switcher">
                          <input
                            type="checkbox"
                            className="switcher-input"
                            defaultChecked
                          />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Notify me by email about sales and latest news
                          </span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="switcher">
                          <input type="checkbox" className="switcher-input" />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Email me about new features and updates
                          </span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="switcher">
                          <input type="checkbox" className="switcher-input" />
                          <span className="switcher-indicator">
                            <span className="switcher-yes" />
                            <span className="switcher-no" />
                          </span>
                          <span className="switcher-label">
                            Email me about tips on using account
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserAccount;
