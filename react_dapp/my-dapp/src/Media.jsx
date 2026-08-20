import mediaContract from "./contracts/media_contract";
import web3 from "./lib/web3";
import { useState, useEffect } from "react";
import lighthouse from "@lighthouse-web3/sdk";

const Media = () => {
  const apiKey = '9d5a6b1b.9b847f33046a4027b35265a68173eeac';
  const storageUrl = 'https://cloudflare-ipfs.com/ipfs/';

  const [account, setAccount] = useState('');
  const [picName, setPicName] = useState("");
  const [file, setFile] = useState(null);
  const [pics, setPics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Зчитування списку картинок з контракту
  const fetchPics = async () => {
    try {
      const result = await mediaContract.methods.get_pics().call();
      setPics(result);
    } catch (error) {
      console.error("Помилка отримання даних з контракту:", error);
    }
  };

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error("Помилка отримання акаунтів:", err);
      }
    };

    loadAccounts();
    fetchPics();

    const handleChangeAccount = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
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

  // Додавання зображення
  const createPicture = async (e) => {
    e.preventDefault();
    if (!file || !picName) return alert("Будь ласка, оберіть файл та введіть назву!");

    try {
      setLoading(true);
      
      // Завантаження у Lighthouse IPFS
      const uploadResult = await lighthouse.upload([file], apiKey);
      const hash = uploadResult.data.Hash;

      // Відправка транзакції в блокчейн
      await mediaContract.methods.new_pic(hash, picName).send({ from: account });

      // Очищення форми та оновлення UI
      setPicName("");
      setFile(null);
      e.target.reset();
      await fetchPics();
    } catch (error) {
      console.error("Помилка при додаванні картинки:", error);
    } finally {
      setLoading(false);
    }
  };

  // Видалення зображення за допомогою прапорця IsDelete
  const deletePicture = async (index) => {
    try {
      setLoading(true);
      await mediaContract.methods.delete_pic(index).send({ from: account });
      await fetchPics();
    } catch (error) {
      console.error("Помилка при видаленні:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h3>Account: {account || "Не підключено"}</h3>

      {/* Форма завантаження */}
      <form onSubmit={createPicture} style={{ marginBottom: "30px" }}>
        <input 
          type="text" 
          value={picName} 
          onChange={(e) => setPicName(e.target.value)} 
          placeholder="Введіть назву" 
          style={{ marginRight: "10px", padding: "6px" }}
          disabled={loading}
        />
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          style={{ marginRight: "10px" }}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ padding: "6px 16px", cursor: "pointer" }}>
          {loading ? "Завантаження..." : "Upload picture"}
        </button>
      </form>

      {/* Відображення карток */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {pics.map((item, index) => {
          // Універсальне зчитування структури Media
          const creator = item.creator || item[0];
          const cid = item.cid || item[1];
          const name = item.name || item[2];
          const timestamp = item.timestamp || item[3];
          const isDeleted = item.isDeleted !== undefined ? item.isDeleted : item[4];

          // Пропускаємо видалені зображення
          if (isDeleted) return null;

          return (
            <div 
              key={index} 
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                width: "220px",
                textAlign: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                backgroundColor: "#fff"
              }}
            >
              <img 
                src={`${storageUrl}${cid}`} 
                alt={name} 
                onError={(e) => {
                  // Перемикання на резервний шлюз у разі затримки індексації
                  e.target.onerror = null;
                  e.target.src = `https://gateway.pinata.cloud/ipfs/${cid}`;
                }}
                style={{ 
                  width: "100%", 
                  height: "160px", 
                  objectFit: "cover", 
                  borderRadius: "6px",
                  backgroundColor: "#f5f5f5"
                }} 
              />
              <h4 style={{ margin: "12px 0 6px 0" }}>{name}</h4>
              <p style={{ fontSize: "12px", color: "#666", margin: "0 0 12px 0" }}>
                {timestamp ? new Date(Number(timestamp) * 1000).toLocaleDateString() : ""}
              </p>

              {/* Кнопка видалення доступна власнику */}
              {account && creator && creator.toLowerCase() === account.toLowerCase() && (
                <button 
                  onClick={() => deletePicture(index)}
                  disabled={loading}
                  style={{ 
                    backgroundColor: "#e63946", 
                    color: "#fff", 
                    border: "none", 
                    padding: "6px 12px", 
                    borderRadius: "4px",
                    cursor: "pointer" 
                  }}
                >
                  Видалити
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Media;