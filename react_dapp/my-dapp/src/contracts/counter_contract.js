import web3 from "../lib/web3";
import contractAbi from "./abi/counterAbi.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const counterContract = new web3.eth.Contract(contractAbi, contractAddress);

export default counterContract;