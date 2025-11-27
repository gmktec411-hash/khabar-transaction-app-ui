import React from "react";
import TransactionsTable from "../components/TransactionsTable";

const Home = ({ transactions }) => {
  return <TransactionsTable transactions={transactions} />;
};

export default Home;
