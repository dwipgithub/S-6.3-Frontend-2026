import React from "react";

const MaintenancePage = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🚧 Under Maintenance 🚧</h1>
      <p style={styles.message}>
        This section is currently under maintenance. Please check back later.
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f0f0",
  },
  header: {
    fontSize: "2.5em",
    color: "#333",
  },
  message: {
    fontSize: "1.2em",
    color: "#666",
  },
};

export default MaintenancePage;
