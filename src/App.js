import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// ==========================================
// 1. CONFIGURATION (Your Real Keys)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB4vu7DkQrKPCi9m4XiALkPFfnCj19HCX0",
  authDomain: "finance-app-b6731.firebaseapp.com",
  projectId: "finance-app-b6731",
  storageBucket: "finance-app-b6731.firebasestorage.app",
  messagingSenderId: "78975781106",
  appId: "1:78975781106:web:7619f5caef9533776c686b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Grid System
const ResponsiveGridLayout = WidthProvider(Responsive);

// ==========================================
// 2. MAIN APPLICATION
// ==========================================
function App() {
  const [transactions, setTransactions] = useState([]);
  
  // Form States
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("General");

  // A. FETCH DATA (Real-time Sync)
  useEffect(() => {
    // connect to "userData" collection
    const unsubscribe = onSnapshot(collection(db, "userData"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, []);

  // B. ADD TRANSACTION
  const addTransaction = async () => {
    if (!desc || !amount) return;

    const newTrans = {
      desc: desc,
      amount: parseFloat(amount),
      type: type,
      category: category,
      date: new Date().toISOString().split('T')[0] // 2023-10-27
    };

    try {
      await addDoc(collection(db, "userData"), newTrans);
      // Clear form
      setDesc("");
      setAmount("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // C. DELETE TRANSACTION
  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, "userData", id));
  };

  // D. CALCULATE TOTALS
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  // E. DASHBOARD LAYOUT
  const layout = [
    { i: "balance", x: 0, y: 0, w: 12, h: 2 },
    { i: "form", x: 0, y: 2, w: 12, h: 5 },
    { i: "list", x: 0, y: 7, w: 12, h: 6 }
  ];

  return (
    <div style={{ padding: "20px", background: "#f4f4f9", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center" }}>💰 My Finance Dashboard</h1>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
      >
        {/* 1. BALANCE CARD */}
        <div key="balance" style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <h3>Balance</h3>
            <h2 style={{ color: balance >= 0 ? "green" : "red" }}>₹{balance}</h2>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3>Income</h3>
            <h2 style={{ color: "green" }}>+₹{income}</h2>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3>Expense</h3>
            <h2 style={{ color: "red" }}>-₹{expense}</h2>
          </div>
        </div>

        {/* 2. INPUT FORM */}
        <div key="form" style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          <h3>➕ Add New</h3>
          <input 
            placeholder="Description (e.g. Salary)" 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px" }}>
            <option value="income">Income (+)</option>
            <option value="expense">Expense (-)</option>
          </select>
          <button onClick={addTransaction} style={{ width: "100%", padding: "10px", background: "blue", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            Add Transaction
          </button>
        </div>

        {/* 3. HISTORY LIST */}
        <div key="list" style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", overflowY: "auto" }}>
          <h3>📜 History</h3>
          {transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "10px 0" }}>
              <span>{t.desc} ({t.date})</span>
              <div>
                <span style={{ color: t.type === "income" ? "green" : "red", fontWeight: "bold", marginRight: "10px" }}>
                  {t.type === "income" ? "+" : "-"}₹{t.amount}
                </span>
                <button onClick={() => deleteTransaction(t.id)} style={{ background: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer" }}>x</button>
              </div>
            </div>
          ))}
        </div>

      </ResponsiveGridLayout>
    </div>
  );
}

export default App;