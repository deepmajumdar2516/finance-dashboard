import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GridLayout from "react-grid-layout";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { arc as d3Arc, pie as d3Pie } from "d3-shape";
import {
  Undo,
  Redo,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  PlusCircle,
  Settings,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
  Target,
  Activity,
  Tag,
  FileText,
  Briefcase,
  Calendar as CalIcon,
  ChevronLeft,
} from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

// --- 1. FIREBASE CONFIGURATION (Real Keys) ---
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

// --- 2. THEME DEFINITIONS ---
const THEMES = {
  light: {
    bg: "#f3f4f6",
    card: "#ffffff",
    text: "#1f2937",
    subText: "#6b7280",
    border: "#e5e7eb",
    input: "#ffffff",
    grid: "#e5e7eb",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    success: "#10b981",
    danger: "#ef4444",
    accent: "#3b82f6",
    warning: "#f59e0b",
  },
  dark: {
    bg: "#111827",
    card: "#1f2937",
    text: "#f9fafb",
    subText: "#9ca3af",
    border: "#374151",
    input: "#374151",
    grid: "#374151",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
    success: "#34d399",
    danger: "#f87171",
    accent: "#60a5fa",
    warning: "#fbbf24",
  },
};

const CATEGORY_LISTS = {
  income: [
    "Salary",
    "Freelance",
    "Business",
    "Dividend",
    "Gift",
    "Refund",
    "Other",
  ],
  investment: [
    "Stocks",
    "Crypto",
    "Mutual Fund",
    "Gold",
    "Real Estate",
    "Bonds",
    "Startups",
  ],
};

// --- 3. LOGIC HOOKS ---

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

// --- 4. DATA CONSTANTS ---
const INITIAL_BUDGETS = {
  Rent: 16000,
  Groceries: 6000,
  Dining: 3000,
  Utilities: 2500,
  "Trading Loss Limit": 5000,
};

// --- 5. CHART COMPONENTS ---

// P&L CALENDAR
const PnLCalendar = ({ transactions, theme }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      const dayTxns = transactions.filter((t) => t.date === dateStr);
      let net = 0;
      dayTxns.forEach((t) => {
        net += t.type === "income" ? t.amount : -t.amount;
      });
      days.push({ day: i, date: dateStr, net, txns: dayTxns });
    }
    return days;
  }, [currentMonth, transactions]);

  if (selectedDate) {
    const details = calendarData.find((d) => d && d.date === selectedDate);
    return (
      <div
        style={{
          padding: "10px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
            paddingBottom: "5px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <button
            onClick={() => setSelectedDate(null)}
            style={{ ...iconBtn(theme), marginRight: "10px" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            style={{ fontWeight: "bold", fontSize: "14px", color: theme.text }}
          >
            {selectedDate}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontWeight: "bold",
              color: details.net >= 0 ? theme.success : theme.danger,
            }}
          >
            {details.net >= 0 ? "+" : "-"}₹
            {Math.abs(details.net).toLocaleString()}
          </span>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {details.txns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: theme.subText,
                fontSize: "12px",
                marginTop: "20px",
              }}
            >
              No activity
            </div>
          ) : (
            details.txns.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: theme.text }}>
                    {t.category}
                  </div>
                  <div style={{ fontSize: "10px", color: theme.subText }}>
                    {(t.tags || []).join(", ")}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    color: t.type === "income" ? theme.success : theme.danger,
                  }}
                >
                  {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "5px",
        }}
      >
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
            )
          }
          style={iconBtn(theme)}
        >
          &lt;
        </button>
        <span
          style={{ fontWeight: "bold", fontSize: "13px", color: theme.text }}
        >
          {monthLabel}
        </span>
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
            )
          }
          style={iconBtn(theme)}
        >
          &gt;
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "2px",
          textAlign: "center",
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} style={{ fontSize: "9px", color: theme.subText }}>
            {d}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
          flexGrow: 1,
          alignContent: "start",
        }}
      >
        {calendarData.map((d, i) => {
          if (!d) return <div key={i}></div>;
          const bg =
            d.net > 0 ? theme.success : d.net < 0 ? theme.danger : theme.bg;
          const color = d.net !== 0 ? "#fff" : theme.text;

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(d.date)}
              style={{
                background: d.net !== 0 ? bg : theme.grid,
                color: color,
                borderRadius: "3px",
                fontSize: "9px",
                height: "35px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                border: d.net === 0 ? `1px solid ${theme.border}` : "none",
              }}
            >
              <span>{d.day}</span>
              {d.net !== 0 && (
                <span style={{ fontWeight: "bold", fontSize: "8px" }}>
                  {d.net >= 1000 || d.net <= -1000
                    ? `${(d.net / 1000).toFixed(0)}k`
                    : d.net}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// NET WORTH CHART
const NetWorthChart = ({ transactions, theme }) => {
  const svgRef = useRef();
  const wrapperRef = useRef();

  const data = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    let runningBalance = 0;
    const points = sorted.map((t) => {
      const impact = t.type === "income" ? t.amount : -t.amount;
      runningBalance += impact;
      return { date: new Date(t.date), value: runningBalance };
    });
    if (points.length === 0) return [{ date: new Date(), value: 0 }];
    return points;
  }, [transactions]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (data.length < 2) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const margin = { top: 10, right: 10, bottom: 20, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, innerW]);
    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.value) * 0.95,
        d3.max(data, (d) => d.value) * 1.05,
      ])
      .range([innerH, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .attr("color", theme.subText);

    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${d / 1000}k`)
      )
      .attr("color", theme.subText);

    const line = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);
    const area = d3
      .area()
      .x((d) => xScale(d.date))
      .y0(innerH)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const gradientId = "areaGradient";
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", theme.success)
      .attr("stop-opacity", 0.4);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", theme.bg)
      .attr("stop-opacity", 0);

    g.append("path")
      .datum(data)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", area);
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", theme.success)
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, theme]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// TRADING STATS
const TradingStatsWidget = ({ transactions, theme }) => {
  const stats = useMemo(() => {
    const trades = transactions.filter((t) => t.isTrading);
    const wins = trades.filter((t) => t.type === "income");
    const losses = trades.filter((t) => t.type === "expense");
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const grossProfit = wins.reduce((a, b) => a + b.amount, 0);
    const grossLoss = losses.reduce((a, b) => a + b.amount, 0);
    const profitFactor =
      grossLoss > 0
        ? (grossProfit / grossLoss).toFixed(2)
        : grossProfit > 0
        ? "∞"
        : "0";
    return { winRate, profitFactor, totalTrades: trades.length };
  }, [transactions]);

  const gaugeRef = useRef();
  useEffect(() => {
    if (!gaugeRef.current) return;
    const svg = d3.select(gaugeRef.current);
    svg.selectAll("*").remove();
    const width = 80,
      height = 80;
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const arc = d3.arc().innerRadius(25).outerRadius(35).startAngle(0);

    g.append("path")
      .datum({ endAngle: 2 * Math.PI })
      .style("fill", theme.grid)
      .attr("d", arc);
    g.append("path")
      .datum({ endAngle: (stats.winRate / 100) * 2 * Math.PI })
      .style("fill", stats.winRate >= 50 ? theme.success : theme.danger)
      .attr("d", arc);
    g.append("text")
      .text(`${Math.round(stats.winRate)}%`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", theme.text)
      .style("font-size", "12px")
      .style("font-weight", "bold");
  }, [stats, theme]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div ref={gaugeRef} style={{ width: 80, height: 80 }}>
          <svg width="80" height="80" />
        </div>
        <div style={{ fontSize: "10px", color: theme.subText }}>Win Rate</div>
      </div>
      <div style={{ width: "1px", height: "50%", background: theme.border }} />
      <div style={{ textAlign: "center" }}>
        <div
          style={{ fontSize: "20px", fontWeight: "bold", color: theme.text }}
        >
          {stats.profitFactor}
        </div>
        <div style={{ fontSize: "10px", color: theme.subText }}>
          Profit Factor
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{ fontSize: "20px", fontWeight: "bold", color: theme.text }}
        >
          {stats.totalTrades}
        </div>
        <div style={{ fontSize: "10px", color: theme.subText }}>
          Total Trades
        </div>
      </div>
    </div>
  );
};

// SANKEY CHART
const SankeyChart = ({ transactions, theme }) => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const data = useMemo(() => {
    const incomeTotal = transactions
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);
    const nodes = [{ name: "Inflow" }];
    const links = [];
    const outflows = transactions.filter((t) => t.type !== "income");
    const categories = {};
    outflows.forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    Object.keys(categories).forEach((cat, idx) => {
      nodes.push({ name: cat });
      links.push({ source: 0, target: idx + 1, value: categories[cat] });
    });
    const totalSpent = Object.values(categories).reduce((a, b) => a + b, 0);
    if (incomeTotal > totalSpent) {
      nodes.push({ name: "Savings" });
      links.push({
        source: 0,
        target: nodes.length - 1,
        value: incomeTotal - totalSpent,
      });
    }
    return { nodes, links };
  }, [transactions]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (data.links.length === 0) {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", theme.subText)
        .text("No Data");
      return;
    }

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const sankey = d3Sankey()
      .nodeWidth(15)
      .nodePadding(12)
      .extent([
        [1, 1],
        [width - 1, height - 10],
      ]);
    const { nodes, links } = sankey({
      nodes: data.nodes.map((d) => ({ ...d })),
      links: data.links.map((d) => ({ ...d })),
    });
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    svg
      .append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d) =>
        d.target.name.includes("Trading")
          ? theme.danger
          : theme.border === "#e5e7eb"
          ? "#cbd5e1"
          : "#4b5563"
      )
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.5);

    svg
      .append("g")
      .selectAll("rect")
      .data(nodes)
      .enter()
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", (d, i) => (i === 0 ? theme.success : color(i)))
      .attr("rx", 2);

    svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
      .text((d) => `${d.name} ₹${Math.round(d.value)}`)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", theme.text);
  }, [data, theme]);
  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// DONUT CHART
const DonutChart = ({ transactions, theme }) => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const grouped = {};
    expenses.forEach(
      (t) => (grouped[t.category] = (grouped[t.category] || 0) + t.amount)
    );
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (data.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", theme.subText)
        .text("No Expenses");
      return;
    }
    const radius = Math.min(width, height) / 2 - 20;
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    const color = d3.scaleOrdinal(d3.schemeSet2);
    const pie = d3Pie()
      .value((d) => d.value)
      .sort(null);
    const arc = d3Arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    g.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.name))
      .attr("stroke", theme.card)
      .attr("stroke-width", "2px");
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "12px")
      .style("fill", theme.subText)
      .text("Total Out");
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.0em")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", theme.text)
      .text(`₹${d3.sum(data, (d) => d.value).toLocaleString()}`);
  }, [data, theme]);
  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// --- 6. WIDGETS ---

const PortfolioWidget = ({ transactions, theme }) => {
  const holdings = useMemo(() => {
    const investments = transactions.filter((t) => t.type === "investment");
    const grouped = {};
    investments.forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  return (
    <div style={{ padding: "10px", height: "100%", overflowY: "auto" }}>
      {holdings.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: theme.subText,
            marginTop: "20px",
          }}
        >
          No Investments
        </div>
      ) : (
        holdings.map(([asset, amount]) => (
          <div
            key={asset}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              borderBottom: `1px solid ${theme.border}`,
              paddingBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: theme.accent,
                }}
              ></div>
              <span
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  color: theme.text,
                }}
              >
                {asset}
              </span>
            </div>
            <span style={{ fontWeight: "bold", color: theme.success }}>
              ₹{amount.toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const BudgetManager = ({ transactions, budgets, setBudgets, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudgets, setTempBudgets] = useState(budgets);
  const spending = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const key = t.isTrading ? "Trading Loss Limit" : t.category;
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {});
  const handleSave = () => {
    setBudgets(tempBudgets);
    setIsEditing(false);
  };
  const handleChange = (cat, val) =>
    setTempBudgets((p) => ({ ...p, [cat]: parseFloat(val) || 0 }));

  return (
    <div
      style={{
        padding: "10px",
        overflowY: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
        }}
      >
        {isEditing ? (
          <div style={{ display: "flex", gap: "5px" }}>
            <button onClick={() => setIsEditing(false)} style={iconBtn(theme)}>
              <X size={14} />
            </button>
            <button
              onClick={handleSave}
              style={{
                ...iconBtn(theme),
                background: theme.success,
                color: "white",
              }}
            >
              <Save size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempBudgets(budgets);
              setIsEditing(true);
            }}
            style={iconBtn(theme)}
          >
            <Settings size={14} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(isEditing ? tempBudgets : budgets).map(
          ([cat, limit]) => {
            const spent = spending[cat] || 0;
            const pct =
              limit > 0
                ? Math.min((spent / limit) * 100, 100)
                : spent > 0
                ? 100
                : 0;
            const color =
              pct > 100
                ? theme.danger
                : pct > 80
                ? theme.warning
                : theme.accent;
            return (
              <div key={cat}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: theme.text,
                  }}
                >
                  <span style={{ fontWeight: "600" }}>{cat}</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => handleChange(cat, e.target.value)}
                      style={{
                        width: "70px",
                        padding: "2px",
                        background: theme.bg,
                        color: theme.text,
                        border: "1px solid " + theme.border,
                      }}
                    />
                  ) : (
                    <span style={{ color: theme.subText }}>
                      ₹{spent} / ₹{limit}
                    </span>
                  )}
                </div>
                {!isEditing && (
                  <div
                    style={{
                      width: "100%",
                      background: theme.grid,
                      height: "6px",
                      borderRadius: "3px",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        background: color,
                        height: "100%",
                        borderRadius: "3px",
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          }
        )}
        {isEditing && (
          <button
            onClick={() => {
              const c = prompt("Category Name:");
              if (c) handleChange(c, 0);
            }}
            style={{ ...linkBtn, color: theme.text }}
          >
            + Add Category
          </button>
        )}
      </div>
    </div>
  );
};

const TransactionForm = ({ onAdd, expenseCategories, theme }) => {
  const [mode, setMode] = useState("simple");
  const [form, setForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    ticker: "",
    tradeType: "profit",
    tags: "",
  });

  const currentCategories = useMemo(() => {
    if (form.type === "income") return CATEGORY_LISTS.income;
    if (form.type === "investment") return CATEGORY_LISTS.investment;
    return expenseCategories;
  }, [form.type, expenseCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) return;

    const currentDate = new Date().toISOString().split("T")[0];

    // NOTE: ID is now handled by Firestore, so we don't set it here.
    const newTx = {
      amount: parseFloat(form.amount),
      date: currentDate,
      isTrading: mode === "trading",
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    };

    if (mode === "trading") {
      newTx.type = form.tradeType === "profit" ? "income" : "expense";
      newTx.category = `Trading: ${form.ticker || "General"}`;
      newTx.ticker = form.ticker || "";
    } else {
      newTx.type = form.type;
      newTx.category = form.category || "Other";
    }

    onAdd(newTx);
    setForm({
      type: "expense",
      category: "",
      amount: "",
      ticker: "",
      tradeType: "profit",
      tags: "",
    });
  };

  const inp = {
    ...inputStyle,
    background: theme.bg,
    color: theme.text,
    borderColor: theme.border,
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        height: "100%",
        padding: "0 15px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          background: theme.bg,
          borderRadius: "6px",
          padding: "2px",
          border: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => setMode("simple")}
          style={{
            ...modeBtn(theme),
            background: mode === "simple" ? theme.card : "transparent",
          }}
        >
          Simple
        </button>
        <button
          onClick={() => setMode("trading")}
          style={{
            ...modeBtn(theme),
            background: mode === "trading" ? theme.card : "transparent",
          }}
        >
          Trading
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}
      >
        {mode === "simple" ? (
          <>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value, category: "" })
              }
              style={inp}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="investment">Invest</option>
            </select>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inp}
            >
              <option value="">Category...</option>
              {currentCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                borderRadius: "4px",
                overflow: "hidden",
                border: `1px solid ${theme.border}`,
              }}
            >
              <button
                type="button"
                onClick={() => setForm({ ...form, tradeType: "profit" })}
                style={{
                  padding: "8px",
                  border: "none",
                  background:
                    form.tradeType === "profit" ? "#dcfce7" : theme.bg,
                  color:
                    form.tradeType === "profit" ? "#166534" : theme.subText,
                }}
              >
                Win
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, tradeType: "loss" })}
                style={{
                  padding: "8px",
                  border: "none",
                  background: form.tradeType === "loss" ? "#fee2e2" : theme.bg,
                  color: form.tradeType === "loss" ? "#991b1b" : theme.subText,
                }}
              >
                Loss
              </button>
            </div>
            <input
              placeholder="Ticker"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              style={inp}
            />
          </>
        )}
        <input
          type="number"
          placeholder="Amt"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          style={inp}
        />
        <input
          placeholder="Tags (comma sep)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          style={inp}
        />
        <button type="submit" style={btnStyle}>
          <PlusCircle size={16} /> Add
        </button>
      </form>
    </div>
  );
};

// --- 7. MAIN APP (MODIFIED FOR FIREBASE) ---

export default function App() {
  // STATE: Replaced local useHistoryState with useState + Firebase Listeners
  const [transactions, setTransactions] = useState([]);
  
  // NOTE: Undo/Redo are disabled in Cloud Sync mode to prevent data conflict
  const undo = () => alert("Undo is disabled in Cloud Mode");
  const redo = () => {};
  const clearAll = () => alert("Cannot clear all cloud data safely from here.");
  const historyMeta = { canUndo: false, canRedo: false };

  const [budgets, setBudgets] = useStickyState(
    INITIAL_BUDGETS,
    "finance_v13_budgets"
  );
  const [darkMode, setDarkMode] = useStickyState(false, "finance_v13_theme");
  const [timeRange, setTimeRange] = useState("all");

  // FIREBASE LISTENER (Read Data)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "userData"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  // FIREBASE ADD (Write Data)
  const handleAddTransaction = async (newTx) => {
    try {
      await addDoc(collection(db, "userData"), newTx);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // FIREBASE DELETE (Delete Data)
  const handleDeleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "userData", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const theme = darkMode ? THEMES.dark : THEMES.light;

  const filteredTransactions = useMemo(() => {
    if (timeRange === "all") return transactions;
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "month") cutoff.setDate(1);
    if (timeRange === "3months") cutoff.setMonth(now.getMonth() - 3);
    return transactions.filter((t) => new Date(t.date) >= cutoff);
  }, [transactions, timeRange]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        if (t.type === "expense") acc.expense += t.amount;
        if (t.type === "investment") acc.invested += t.amount;
        if (t.isTrading) {
          if (t.type === "income") acc.tradingProfit += t.amount;
          if (t.type === "expense") acc.tradingLoss += t.amount;
        }
        return acc;
      },
      { income: 0, expense: 0, invested: 0, tradingProfit: 0, tradingLoss: 0 }
    );
  }, [filteredTransactions]);

  const balance = totals.income - totals.expense - totals.invested;
  const tradingNet = totals.tradingProfit - totals.tradingLoss;

  const handleBackupJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ transactions, budgets }));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `finance_backup.json`;
    a.click();
  };

  const handleDownloadExcel = () => {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Ticker",
      "Status",
      "Tags",
    ];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type,
      t.category,
      t.amount,
      t.ticker || "",
      t.isTrading ? (t.type === "income" ? "Win" : "Loss") : "Regular",
      (t.tags || []).join(" "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "finance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Note: Restore is disabled for Safety in Cloud Sync version
  const handleRestore = (e) => {
    alert("Restore from file is disabled while Cloud Sync is active to prevent data overwrites.");
  };

  const layout = [
    { i: "stats", x: 0, y: 0, w: 12, h: 2, static: true },
    { i: "trend", x: 0, y: 2, w: 8, h: 4, static: true },
    { i: "winrate", x: 8, y: 2, w: 4, h: 4, static: true },
    { i: "pnl_cal", x: 0, y: 6, w: 6, h: 5, static: true },
    { i: "donut", x: 6, y: 6, w: 6, h: 5, static: true },
    { i: "sankey", x: 0, y: 11, w: 12, h: 4, static: true },
    { i: "budget", x: 0, y: 15, w: 4, h: 4, static: true },
    { i: "portfolio", x: 4, y: 15, w: 4, h: 4, static: true },
    { i: "list", x: 8, y: 15, w: 4, h: 4, static: true },
    { i: "input", x: 0, y: 19, w: 12, h: 2, static: true },
  ];

  return (
    <div
      style={{
        padding: "20px",
        background: theme.bg,
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: theme.text,
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>
            Financial Command
          </h1>
          <div
            style={{
              fontSize: "12px",
              color: theme.subText,
              marginTop: "6px",
              display: "flex",
              gap: "12px",
            }}
          >
            {["all", "3months", "month"].map((range) => (
              <span
                key={range}
                onClick={() => setTimeRange(range)}
                style={filterLink(timeRange === range, theme)}
              >
                {range === "all"
                  ? "All Time"
                  : range === "3months"
                  ? "Last 3 Months"
                  : "This Month"}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={iconBtn(theme)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div
            style={{ width: "1px", height: "20px", background: theme.border }}
          />
          <button
            onClick={undo}
            disabled={true}
            style={{
              ...actionBtn(theme),
              opacity: 0.3, 
              cursor: "not-allowed"
            }}
            title="Undo disabled in Cloud Mode"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            disabled={true}
            style={{
              ...actionBtn(theme),
              opacity: 0.3,
              cursor: "not-allowed"
            }}
             title="Redo disabled in Cloud Mode"
          >
            <Redo size={16} />
          </button>
          <button
            onClick={handleDownloadExcel}
            style={actionBtn(theme)}
            title="Download Report (Excel/CSV)"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={handleBackupJSON}
            style={actionBtn(theme)}
            title="Save Backup (JSON)"
          >
            <Save size={16} />
          </button>
          <label style={{ ...actionBtn(theme), cursor: "pointer", opacity: 0.5 }}>
            <Upload size={16} />{" "}
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleRestore}
              accept=".json"
              disabled={true}
            />
          </label>
          <button
            onClick={clearAll}
            style={{
              ...actionBtn(theme),
              color: theme.danger,
              borderColor: theme.danger,
              opacity: 0.5
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={70}
        width={1200}
        draggableHandle=".drag-handle"
        isDraggable={false}
        isResizable={false}
      >
        <div key="stats" style={{ display: "flex", gap: "15px" }}>
          <StatBox
            title="Net Worth"
            value={balance}
            color={theme.success}
            theme={theme}
          />
          <StatBox
            title="Income"
            value={totals.income - totals.tradingProfit}
            color={theme.accent}
            theme={theme}
          />
          <StatBox
            title="Expense"
            value={totals.expense - totals.tradingLoss}
            color={theme.danger}
            theme={theme}
          />
          <div
            style={{
              flex: 1,
              background: theme.card,
              borderRadius: "10px",
              padding: "15px",
              boxShadow: theme.shadow,
              borderLeft: `4px solid ${
                tradingNet >= 0 ? theme.success : theme.danger
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                color: theme.subText,
                textTransform: "uppercase",
              }}
            >
              {tradingNet >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}{" "}
              Trading P&L
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: tradingNet >= 0 ? theme.success : theme.danger,
              }}
            >
              {tradingNet >= 0 ? "+" : ""}₹{tradingNet.toLocaleString()}
            </div>
          </div>
        </div>

        <div key="trend" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Net Worth History
          </div>
          <div style={{ flexGrow: 1, padding: "10px" }}>
            <NetWorthChart transactions={filteredTransactions} theme={theme} />
          </div>
        </div>
        <div key="winrate" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Trading Performance
          </div>
          <div style={{ flexGrow: 1, padding: "10px" }}>
            <TradingStatsWidget
              transactions={filteredTransactions}
              theme={theme}
            />
          </div>
        </div>

        {/* NEW PnL CALENDAR (6 Cols) */}
        <div key="pnl_cal" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Profit & Loss Calendar
          </div>
          <PnLCalendar transactions={filteredTransactions} theme={theme} />
        </div>

        {/* DONUT (6 Cols) */}
        <div key="donut" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Expense Breakdown
          </div>
          <div style={{ flexGrow: 1, padding: "10px" }}>
            <DonutChart transactions={filteredTransactions} theme={theme} />
          </div>
        </div>

        <div key="sankey" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Money Flow
          </div>
          <div style={{ flexGrow: 1, padding: "10px" }}>
            <SankeyChart transactions={filteredTransactions} theme={theme} />
          </div>
        </div>

        <div key="budget" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Budgets
          </div>
          <BudgetManager
            transactions={filteredTransactions}
            budgets={budgets}
            setBudgets={setBudgets}
            theme={theme}
          />
        </div>

        <div key="portfolio" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            Portfolio
          </div>
          <PortfolioWidget transactions={filteredTransactions} theme={theme} />
        </div>

        <div key="list" style={cardStyle(theme)}>
          <div
            className="drag-handle"
            style={{ ...headerStyle(theme), justifyContent: "space-between" }}
          >
            <span>History</span>
          </div>
          <div style={{ overflowY: "auto", flexGrow: 1 }}>
            <table
              style={{
                width: "100%",
                fontSize: "13px",
                borderCollapse: "collapse",
                color: theme.text,
              }}
            >
              <tbody>
                {filteredTransactions
                  .slice()
                  .reverse()
                  .map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid " + theme.border,
                        background: t.isTrading
                          ? darkMode
                            ? "rgba(16, 185, 129, 0.1)"
                            : "#f0fdf4"
                          : "transparent",
                      }}
                    >
                      <td style={{ padding: "8px 12px" }}>
                        <div
                          style={{
                            fontWeight: "600",
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          {t.category}
                          {t.tags &&
                            t.tags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: "9px",
                                  background: theme.border,
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                        <div style={{ fontSize: "10px", color: theme.subText }}>
                          {t.date}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "8px 12px",
                          fontWeight: "bold",
                          color:
                            t.type === "income" ? theme.success : theme.danger,
                        }}
                      >
                        {t.type === "income" ? "+" : "-"}₹{t.amount}
                      </td>
                      <td style={{ width: "30px" }}>
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: theme.subText,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div key="input" style={cardStyle(theme)}>
          <div className="drag-handle" style={headerStyle(theme)}>
            New Entry
          </div>
          <TransactionForm
            onAdd={handleAddTransaction}
            expenseCategories={Object.keys(budgets)}
            theme={theme}
          />
        </div>
      </GridLayout>
    </div>
  );
}

// --- STYLES ---
const StatBox = ({ title, value, color, theme }) => (
  <div
    style={{
      flex: 1,
      background: theme.card,
      borderRadius: "10px",
      padding: "15px",
      boxShadow: theme.shadow,
      borderLeft: `4px solid ${color}`,
    }}
  >
    <div
      style={{
        fontSize: "11px",
        color: theme.subText,
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: "24px", fontWeight: "800", color: theme.text }}>
      ₹{value.toLocaleString()}
    </div>
  </div>
);
const cardStyle = (t) => ({
  background: t.card,
  borderRadius: "10px",
  boxShadow: t.shadow,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${t.border}`,
});
const headerStyle = (t) => ({
  background: t.bg,
  padding: "8px 12px",
  fontSize: "13px",
  fontWeight: "700",
  color: t.subText,
  borderBottom: `1px solid ${t.border}`,
  cursor: "move",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});
const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  flex: 1,
  fontSize: "13px",
};
const btnStyle = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "5px",
};
const actionBtn = (t) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  background: t.card,
  border: `1px solid ${t.border}`,
  borderRadius: "6px",
  cursor: "pointer",
  color: t.text,
});
const iconBtn = (t) => ({
  border: "none",
  background: "transparent",
  padding: "4px",
  borderRadius: "4px",
  cursor: "pointer",
  color: t.text,
});
const modeBtn = (t) => ({
  border: "none",
  padding: "4px 8px",
  fontSize: "11px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "500",
  color: t.text,
});
const linkBtn = {
  fontSize: "11px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  padding: "5px 0",
};
const filterLink = (active, t) => ({
  cursor: "pointer",
  fontWeight: active ? "bold" : "normal",
  textDecoration: active ? "underline" : "none",
  color: active ? t.text : t.subText,
});