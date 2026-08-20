import { useState, useEffect } from "react";
import web3 from "./lib/web3";
import counterContract from "./contracts/counter_contract";

const App = () => {
  const [account, setAccount] = useState("");
  const [counter, setCounter] = useState(-1);
  const [newValue, setNewValue] = useState(0);

  useEffect(() => {

    const loadAccounts = async () => {
      const accounts = await web3.eth.getAccounts();

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    };

    loadAccounts();
    
    getCounter();

    const handleChangeAccount = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleChangeAccount);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleChangeAccount);
      }
    };

  }, []);

  const getCounter = async() => {
    const result = await counterContract.methods.get_value().call();
    setCounter(result);
  }

  const setCount = async(e)=>{
    e.preventDefault();
    await counterContract.methods.set_value(newValue).send({from: account});
    getCounter();
  }

  const getNextValue = async()=>{
    await counterContract.methods.set_value(Number(counter)-1).send({from:account});
    getCounter();
  }

  return (
    <div>
      <h3>Account: {account}</h3>
      <h3>Stored value: {counter}</h3>
      <form onSubmit={setCount}>
        <input type="number" onChange={(e)=> setNewValue(e.target.value)} placeholder="set new count"  />
        <button type="submit">Set count</button>
      </form>
      <button onClick={getNextValue}>Next value</button>
    </div>
  );
};

export default App;