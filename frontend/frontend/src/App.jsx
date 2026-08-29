import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'zero-waste' | 'mandi' | 'marketplace'
  const [backendStatus, setBackendStatus] = useState('Connecting to Python API...')
  
  // Chat State
  // Load saved chat from browser memory on startup, or fall back to default welcome message
const [messages, setMessages] = useState(() => {
  const savedChats = localStorage.getItem('interone_chat_history')
  return savedChats ? JSON.parse(savedChats) : [
    { sender: 'ai', text: 'Hello! I am your InterOne Agricultural Advisor. Ask me anything about crop pricing, buyer matching, or selling surplus produce!' }
  ]
})

// Automatically save to local storage whenever a new message is sent or received
useEffect(() => {
  localStorage.setItem('interone_chat_history', JSON.stringify(messages))
}, [messages])

  // Zero-Waste State
  const [crop, setCrop] = useState('Coconut')
  const [quantity, setQuantity] = useState('200')
  const [location, setLocation] = useState('Pollachi, Tamil Nadu')
  const [condition, setCondition] = useState('Slightly Bruised / B-Grade')
  const [zwResult, setZwResult] = useState('')
  const [zwLoading, setZwLoading] = useState(false)

  // Mandi Price State
  const [mandiCrop, setMandiCrop] = useState('Coconut')
  const [mandiLocation, setMandiLocation] = useState('Pollachi, Tamil Nadu')
  const [mandiReport, setMandiReport] = useState('')
  const [mandiLoading, setMandiLoading] = useState(false)

  // Marketplace State
  const [listings, setListings] = useState([])
  const [farmerName, setFarmerName] = useState('')
  const [listCrop, setListCrop] = useState('')
  const [listQty, setListQty] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [listLoc, setListLoc] = useState('')
  const [listContact, setListContact] = useState('')

  const fetchListings = () => {
  fetch('http://127.0.0.1:8000/api/listings')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setListings(data)
      } else {
        setListings([])
      }
    })
    .catch(() => setListings([]))
}

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus('Offline'))

    fetchListings()
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = input
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error connecting to AI service.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleZeroWasteSubmit = async (e) => {
    e.preventDefault()
    setZwLoading(true)
    setZwResult('')

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/zero-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: crop,
          quantity_kg: parseFloat(quantity),
          location: location,
          condition: condition
        }),
      })
      const data = await res.json()
      setZwResult(data.strategy)
    } catch (err) {
      setZwResult('Failed to generate zero-waste strategy.')
    } finally {
      setZwLoading(false)
    }
  }

  const handleMandiSubmit = async (e) => {
    e.preventDefault()
    setMandiLoading(true)
    setMandiReport('')

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/mandi-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: mandiCrop,
          location: mandiLocation
        }),
      })
      const data = await res.json()
      setMandiReport(data.report)
    } catch (err) {
      setMandiReport('Failed to fetch Mandi price intelligence.')
    } finally {
      setMandiLoading(false)
    }
  }

 const handleCreateListing = async (e) => {
  e.preventDefault()
  if (!farmerName || !listCrop || !listQty || !listPrice) return

  try {
    const res = await fetch('http://127.0.0.1:8000/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_name: farmerName,
        crop_name: listCrop,
        quantity_kg: parseFloat(listQty),
        price_per_kg: parseFloat(listPrice),
        location: listLoc || 'Tamil Nadu',
        contact: listContact || 'Contact Farmer'
      }),
    })
    if (res.ok) {
      alert('🎉 Produce listing posted successfully!')
      fetchListings()
      setFarmerName('')
      setListCrop('')
      setListQty('')
      setListPrice('')
      setListLoc('')
      setListContact('')
    }
  } catch (err) {
    alert('Failed to post listing.')
  }
}

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', maxWidth: '950px', margin: '0 auto', padding: '1.5rem', textAlign: 'left' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #22c55e', paddingBottom: '1rem' }}>
        <h2>🌾 InterOne Smart Marketplace</h2>
        <span style={{ background: backendStatus.includes('Running') ? '#dcfce7' : '#fee2e2', color: backendStatus.includes('Running') ? '#15803d' : '#b91c1c', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
          Backend: {backendStatus}
        </span>
      </header>

      {/* NAVIGATION TABS */}
      <nav style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{ background: activeTab === 'chat' ? '#22c55e' : 'transparent', color: activeTab === 'chat' ? '#ffffff' : '#4b5563', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🤖 AI Advisory Chat
        </button>
        <button
          onClick={() => setActiveTab('zero-waste')}
          style={{ background: activeTab === 'zero-waste' ? '#22c55e' : 'transparent', color: activeTab === 'zero-waste' ? '#ffffff' : '#4b5563', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ♻️ Zero-Waste Redirection
        </button>
        <button
          onClick={() => setActiveTab('mandi')}
          style={{ background: activeTab === 'mandi' ? '#22c55e' : 'transparent', color: activeTab === 'mandi' ? '#ffffff' : '#4b5563', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📊 Mandi Price Intelligence
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          style={{ background: activeTab === 'marketplace' ? '#22c55e' : 'transparent', color: activeTab === 'marketplace' ? '#ffffff' : '#4b5563', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🛒 Direct Marketplace
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ marginTop: '1.5rem' }}>
        
        {/* TAB 1: AI CHAT */}
        {activeTab === 'chat' && (
          <div>
            <h3>Gemini AI Agricultural Assistant</h3>
            <p style={{ color: '#666' }}>Ask about market trends, direct sales options, or current prices.</p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', height: '400px', overflowY: 'auto', padding: '1rem', background: '#f9fafb', marginBottom: '1rem' }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '0.75rem 0' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.2rem', borderRadius: '12px', maxWidth: '85%', textAlign: 'left', background: m.sender === 'user' ? '#22c55e' : '#ffffff', color: m.sender === 'user' ? '#ffffff' : '#1f2937', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {m.sender === 'user' ? <p style={{ margin: 0 }}>{m.text}</p> : <ReactMarkdown>{m.text}</ReactMarkdown>}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: '#888', fontStyle: 'italic' }}>InterOne AI is thinking...</div>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type your question..." style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              <button onClick={sendMessage} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
            </div>
          </div>
        )}

        {/* TAB 2: ZERO-WASTE */}
        {activeTab === 'zero-waste' && (
          <div>
            <h3>Zero-Waste Secondary Channel Finder</h3>
            <p style={{ color: '#666' }}>Find local secondary buyers for surplus or B-grade produce to ensure 0% wastage.</p>
            <form onSubmit={handleZeroWasteSubmit} style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Crop Name:</label>
                <input type="text" value={crop} onChange={(e) => setCrop(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Unsold Quantity (kg):</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Location:</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Produce Condition:</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }}>
                  <option value="Fresh / Fresh Surplus">Fresh / Fresh Surplus</option>
                  <option value="Slightly Bruised / B-Grade">Slightly Bruised / B-Grade</option>
                  <option value="Overripe / Fast Perishing">Overripe / Fast Perishing</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" disabled={zwLoading} style={{ width: '100%', background: '#16a34a', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                  {zwLoading ? 'Analyzing Channels...' : 'Find Secondary Channels'}
                </button>
              </div>
            </form>

            {zwResult && (
              <div style={{ marginTop: '1.5rem', padding: '1.2rem', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'left', lineHeight: '1.6' }}>
                <ReactMarkdown>{zwResult}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANDI PRICES */}
        {activeTab === 'mandi' && (
          <div>
            <h3>Mandi Price Intelligence & Trend Predictor</h3>
            <p style={{ color: '#666' }}>Get realistic price benchmarks and multi-mandi rate comparisons.</p>
            <form onSubmit={handleMandiSubmit} style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Crop Name:</label>
                <input type="text" value={mandiCrop} onChange={(e) => setMandiCrop(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Mandi / Location:</label>
                <input type="text" value={mandiLocation} onChange={(e) => setMandiLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <button type="submit" disabled={mandiLoading} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', height: '38px' }}>
                {mandiLoading ? 'Analyzing...' : 'Fetch Market Intel'}
              </button>
            </form>

            {mandiReport && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'left', lineHeight: '1.6', color: '#1f2937' }}>
                <ReactMarkdown>{mandiReport}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIRECT MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div>
            <h3>Direct Wholesale Produce Marketplace</h3>
            <p style={{ color: '#666' }}>Post harvested crops for direct sale or view active listings from local farmers.</p>

            {/* Post Listing Form */}
            <form onSubmit={handleCreateListing} style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Farmer Name:</label>
                <input type="text" required value={farmerName} onChange={(e) => setFarmerName(e.target.value)} placeholder="e.g. Arumugam" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Crop Name:</label>
                <input type="text" required value={listCrop} onChange={(e) => setListCrop(e.target.value)} placeholder="e.g. Red Onion" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Available Qty (kg):</label>
                <input type="number" required value={listQty} onChange={(e) => setListQty(e.target.value)} placeholder="e.g. 1000" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Asking Price (₹/kg):</label>
                <input type="number" required value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="e.g. 35" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Location:</label>
                <input type="text" value={listLoc} onChange={(e) => setListLoc(e.target.value)} placeholder="e.g. Salem, TN" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Contact No:</label>
                <input type="text" value={listContact} onChange={(e) => setListContact(e.target.value)} placeholder="e.g. 9876543210" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.2rem' }} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <button type="submit" style={{ width: '100%', background: '#16a34a', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Post Produce Listing
                </button>
              </div>
            </form>

            {/* Active Listings Grid */}
            <h4 style={{ marginBottom: '1rem' }}>Active Direct Produce Listings ({listings.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {listings.map((item) => (
                <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#15803d' }}>{item.crop_name}</h4>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ₹{item.price_per_kg} / kg
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '0.9rem', color: '#374151' }}>
                    <strong>Farmer:</strong> {item.farmer_name} | <strong>Qty:</strong> {item.quantity_kg} kg
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    📍 {item.location}
                  </p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '600' }}>📞 {item.contact}</span>
                    <button onClick={() => alert(`Connecting you with ${item.farmer_name} (${item.contact})`)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                      Contact Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App