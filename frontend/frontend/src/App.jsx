import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { API_BASE_URL } from './api'
import farmerMascot from './assets/mascot.png'; 

function App() {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [backendStatus, setBackendStatus] = useState(
    'Connecting to Python API...'
  )


  // =========================================================
  // DRAGGABLE POPUP STATE & HANDLERS
  // =========================================================
  const [popupPos, setPopupPos] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - popupPos.x,
      y: e.clientY - popupPos.y
    })
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      setPopupPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])
  
  // =========================================================
  // GOOGLE MAPS LOCATION
  // =========================================================

  const openGoogleMaps = (place) => {
    if (!place.trim()) return

    const mapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

    window.open(
      mapsUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('❌ Geolocation is not supported by this browser.')
    return
  }

  setLocationLoading(true)

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      setLatitude(lat)
      setLongitude(lng)

      // Store coordinates in the location field
      setListLoc(
        `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      )

      setLocationLoading(false)

      alert('📍 Current location captured successfully!')
    },

    (error) => {
      console.error(error)

      setLocationLoading(false)

      alert(
        '❌ Unable to get your location. Please allow location access and try again.'
      )
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}
  // =========================================================
  // AI FARMER POPUP
  // =========================================================

  const [showFarmerPopup, setShowFarmerPopup] = useState(false)
  const [farmerPopupClosed, setFarmerPopupClosed] = useState(false)

  // =========================================================
  // PRODUCT IMAGE ANALYSIS POPUP
  // =========================================================

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductAnalysis, setShowProductAnalysis] = useState(false)
  const [productAnalysis, setProductAnalysis] = useState('')
  const [productAnalysisLoading, setProductAnalysisLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFarmerPopup(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // =========================================================
  // PAGE-SPECIFIC AI FARMER MESSAGES
  // =========================================================

  const farmerMessages = {
    chat: {
      title: 'How can I help you today? 🌱',
      message:
        'Ask me about crop prices, buyers, selling strategies, or anything about your harvest.',
      button: "🤖 Ask InterOne"
    },

    'zero-waste': {
      title: 'Need a zero-waste solution? ♻️',
      message:
        'Tell me about your surplus produce and I can help you find useful channels.',
      button: '♻️ Find Solutions'
    },

    mandi: {
      title: 'Want to know the market price? 💰',
      message:
        'I can help you understand market prices before you decide where to sell.',
      button: '📊 Ask About Price'
    },

    marketplace: {
      title: 'Looking for a buyer? 🛒',
      message:
        'InterOne can help you connect directly with buyers. You can also click a produce image to request a visual quality analysis.',
      button: '🤝 Find Buyers'
    }
  }

  const currentFarmerMessage =
    farmerMessages[activeTab]

  // =========================================================
  // CHAT
  // =========================================================

  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem(
      'interone_chat_history'
    )

    return savedChats
      ? JSON.parse(savedChats)
      : [
          {
            sender: 'ai',
            text:
              'Hello! I am your InterOne Agricultural Advisor. Ask me anything about crop pricing, buyer matching, or selling surplus produce!'
          }
        ]
  })

  useEffect(() => {
    localStorage.setItem(
      'interone_chat_history',
      JSON.stringify(messages)
    )
  }, [messages])

  // =========================================================
  // ZERO WASTE
  // =========================================================

  const [crop, setCrop] = useState('Coconut')
  const [quantity, setQuantity] = useState('200')
  const [location, setLocation] = useState(
    'Pollachi, Tamil Nadu'
  )
  const [condition, setCondition] = useState(
    'Slightly Bruised / B-Grade'
  )

  const [zwResult, setZwResult] = useState('')
  const [zwLoading, setZwLoading] = useState(false)

  const [zwProgress, setZwProgress] = useState(0)
  const [zwStage, setZwStage] = useState('ready')

  // =========================================================
  // MANDI
  // =========================================================

  const [mandiCrop, setMandiCrop] = useState('Coconut')
  const [mandiLocation, setMandiLocation] = useState(
    'Pollachi, Tamil Nadu'
  )
  const [mandiReport, setMandiReport] = useState('')
  const [mandiLoading, setMandiLoading] = useState(false)

  // =========================================================
  // MARKETPLACE
  // =========================================================

  const [listings, setListings] = useState([])

  const [farmerName, setFarmerName] = useState('')
  const [listImage, setListImage] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)

  const [listCrop, setListCrop] = useState('')
  const [listQty, setListQty] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [listLoc, setListLoc] = useState('')
  const [listContact, setListContact] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // =========================================================
  // PRODUCE IMAGE
  // =========================================================

  const [produceImage, setProduceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // =========================================================
  // FETCH MARKETPLACE LISTINGS
  // =========================================================
  const fetchListings = () => {
    fetch(`${API_BASE_URL}/api/listings`)
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

    // =========================================================
   // BACKEND CONNECTION
  // =========================================================
  useEffect(() => {
  fetch("/api/health")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data && data.status === "Running") {
        setBackendStatus("Online");
      } else {
        setBackendStatus("Offline");
      }
    })
    .catch((err) => {
      console.error("Backend fetch error:", err);
      setBackendStatus("Offline");
    });
    
  fetchListings();
}, []);

// =========================================================
  // AI CHAT
  // =========================================================

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMsg = input

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userMsg
      }
    ])

    setInput('')
    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMsg
          })
        }
      )

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply
        }
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Error connecting to AI service.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // ZERO-WASTE GAME LOADING
  // =========================================================

  const handleZeroWasteSubmit = async (e) => {
    e.preventDefault()

    setZwLoading(true)
    setZwResult('')
    setZwProgress(0)
    setZwStage('tractor')

    let progress = 0

    const progressTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 2

      if (progress >= 100) {
        progress = 100
        clearInterval(progressTimer)
      }

      setZwProgress(progress)

      if (progress < 35) {
        setZwStage('tractor')
      } else if (progress < 70) {
        setZwStage('loading')
      } else if (progress < 95) {
        setZwStage('truck')
      } else {
        setZwStage('complete')
      }
    }, 180)

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ai/zero-waste`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            crop_name: crop,
            quantity_kg: parseFloat(quantity),
            location: location,
            condition: condition
          })
        }
      )

      const data = await res.json()

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      )

      clearInterval(progressTimer)

      setZwProgress(100)
      setZwStage('complete')

      await new Promise((resolve) =>
        setTimeout(resolve, 900)
      )

      setZwResult(data.strategy)
    } catch (err) {
      clearInterval(progressTimer)

      setZwProgress(100)
      setZwStage('error')

      setZwResult(
        'Failed to generate zero-waste strategy.'
      )
    } finally {
      setZwLoading(false)
    }
  }

  // =========================================================
  // MANDI PRICE
  // =========================================================

  const handleMandiSubmit = async (e) => {
    e.preventDefault()

    setMandiLoading(true)
    setMandiReport('')

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ai/mandi-price`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            crop_name: mandiCrop,
            location: mandiLocation
          })
        }
      )

      const data = await res.json()

      setMandiReport(data.report)
    } catch (err) {
      setMandiReport(
        'Failed to fetch Mandi price intelligence.'
      )
    } finally {
      setMandiLoading(false)
    }
  }

  // =========================================================
  // IMAGE SELECTION
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      setProduceImage(null)
      setImagePreview('')
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert(
        '❌ Only JPG, PNG, and WEBP images are allowed.'
      )

      e.target.value = ''
      setProduceImage(null)
      setImagePreview('')
      return
    }

    const MAX_SIZE = 200 * 1024

    if (file.size > MAX_SIZE) {
      alert(
        '❌ Image must be 200 KB or smaller.'
      )

      e.target.value = ''
      setProduceImage(null)
      setImagePreview('')
      return
    }

    setProduceImage(file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  // =========================================================
  // CREATE MARKETPLACE LISTING
  // =========================================================

  const handleCreateListing = async (e) => {
    e.preventDefault()

    if (
      !farmerName ||
      !listCrop ||
      !listQty ||
      !listPrice
    ) {
      alert(
        'Please fill in all required listing details.'
      )
      return
    }

    try {
      let imagePath = null

      // =====================================================
      // STEP 1: UPLOAD IMAGE
      // =====================================================

      if (produceImage) {
        setImageUploading(true)

        const formData = new FormData()

        formData.append(
          'file',
          produceImage
        )

        const imageResponse = await fetch(
          `${API_BASE_URL}/api/upload-image`,
          {
            method: 'POST',
            body: formData
          }
        )

        const imageData =
          await imageResponse.json()

        if (!imageResponse.ok) {
          throw new Error(
            imageData.detail ||
            'Image upload failed.'
          )
        }

        imagePath = imageData.image_path
      }

      // =====================================================
      // STEP 2: CREATE LISTING
      // =====================================================

      const res = await fetch(
        `${API_BASE_URL}/api/listings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            farmer_name: farmerName,
            crop_name: listCrop,
            quantity_kg: parseFloat(listQty),
            price_per_kg: parseFloat(listPrice),
           location:
  listLoc || 'Tamil Nadu',

latitude: latitude,
longitude: longitude,

contact:
  listContact || 'Contact Farmer',

image_path: imagePath
          })
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.detail ||
          'Failed to create listing.'
        )
      }

      alert(
        '🎉 Produce listing posted successfully!'
      )

      fetchListings()

      // =====================================================
      // RESET FORM
      // =====================================================

      setFarmerName('')
      setListCrop('')
      setListQty('')
      setListPrice('')
      setListLoc('')
      setListContact('')

      setProduceImage(null)
      setImagePreview('')

      const fileInput =
        document.getElementById(
          'produce-image'
        )

      if (fileInput) {
        fileInput.value = ''
      }

    } catch (err) {
      console.error(err)

      alert(
        `❌ ${err.message || 'Failed to post listing.'}`
      )
    } finally {
      setImageUploading(false)
    }
  }

  // =========================================================
  // OPEN PRODUCT ANALYSIS POPUP
  // =========================================================

  const handleProductImageClick = (item) => {
    if (!item.image_path) return

    setSelectedProduct(item)
    setProductAnalysis('')
    setProductAnalysisLoading(false)

    setShowFarmerPopup(false)
    setShowProductAnalysis(true)
  }

  // =========================================================
  // ANALYSE SELECTED PRODUCT
  // =========================================================

const handleAnalyzeProduct = async () => {
    if (!selectedProduct?.image_path) return

    try {
      setProductAnalysisLoading(true)
      setProductAnalysis('')

      let imageFile

      // 1. If Base64 string, convert directly in JS without fetch()
      if (selectedProduct.image_path.startsWith('data:')) {
        const arr = selectedProduct.image_path.split(',')
        const mime = arr[0].match(/:(.*?);/)[1] || 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const imageBlob = new Blob([u8arr], { type: mime })
        imageFile = new File([imageBlob], 'produce-image.jpg', { type: mime })
      } else {
        // 2. Fallback fetch for standard HTTP image paths
        const imageUrl = selectedProduct.image_path.startsWith('http')
          ? selectedProduct.image_path
          : `${API_BASE_URL}${selectedProduct.image_path}`

        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error('Unable to load product image.')
        }
        const imageBlob = await imageResponse.blob()
        imageFile = new File([imageBlob], 'produce-image.jpg', {
          type: imageBlob.type || 'image/jpeg'
        })
      }

      // 3. Send image to AI Analysis endpoint
      const formData = new FormData()
      formData.append('crop_name', selectedProduct.crop_name)
      formData.append('file', imageFile)

      const response = await fetch(
        `${API_BASE_URL}/api/ai/analyze-produce`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          'Product analysis failed.'
        )
      }

      if (data.status === 'success') {
        setProductAnalysis(
          data.analysis
        )
      } else {
        setProductAnalysis(
          data.analysis ||
          'Unable to analyse this product.'
        )
      }

    } catch (error) {
      console.error(error)

      setProductAnalysis(
        `❌ Product analysis failed: ${
          error.message ||
          'Unknown error'
        }`
      )
    } finally {
      setProductAnalysisLoading(false)
    }
  }
    
  // =========================================================
  // CLOSE PRODUCT ANALYSIS
  // =========================================================

  const closeProductAnalysis = () => {
    setShowProductAnalysis(false)
    setSelectedProduct(null)
    setProductAnalysis('')
    setProductAnalysisLoading(false)

    setFarmerPopupClosed(true)
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      style={{
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '1.5rem',
        textAlign: 'left'
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #22c55e',
          paddingBottom: '1rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.7rem'
            }}
          >
            🌾 InterOne Smart Marketplace
          </h2>

          <p
            style={{
              margin: '5px 0 0',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}
          >
            AI-powered agricultural decision intelligence
          </p>
        </div>

        <span
  style={{
    background: backendStatus === 'Online' ? '#dcfce7' : '#fee2e2',
    color: backendStatus === 'Online' ? '#15803d' : '#b91c1c',
    padding: '0.5rem 0.9rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem'
  }}
>
  <span
    style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: backendStatus === 'Online' ? '#22c55e' : '#ef4444',
      display: 'inline-block'
    }}
  ></span>
  Backend: {backendStatus}
</span>
      </header>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

<nav
  style={{
    display: 'flex',
    gap: '0.65rem',
    marginTop: '1.5rem',
    paddingBottom: '0.7rem',
    alignItems: 'center'
  }}
>
  {/* 1. MARKETPLACE (Swapped to first position) */}
  <button
    onClick={() => setActiveTab('marketplace')}
    style={{
      background: activeTab === 'marketplace' ? '#22c55e' : '#f3f4f6',
      color: activeTab === 'marketplace' ? '#ffffff' : '#374151',
      border: 'none',
      padding: '0.7rem 1.1rem',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}
  >
    🛒 Marketplace
  </button>

  {/* 2. ZERO-WASTE */}
  <button
    onClick={() => setActiveTab('zero-waste')}
    style={{
      background: activeTab === 'zero-waste' ? '#22c55e' : '#f3f4f6',
      color: activeTab === 'zero-waste' ? '#ffffff' : '#374151',
      border: 'none',
      padding: '0.7rem 1.1rem',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}
  >
    ♻️ Zero-Waste
  </button>

  {/* 3. MANDI INTELLIGENCE */}
  <button
    onClick={() => setActiveTab('mandi')}
    style={{
      background: activeTab === 'mandi' ? '#22c55e' : '#f3f4f6',
      color: activeTab === 'mandi' ? '#ffffff' : '#374151',
      border: 'none',
      padding: '0.7rem 1.1rem',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}
  >
    📊 Mandi Price Intelligence
  </button>

  {/* 4. AI ADVISORY (Swapped to fourth position) */}
  <button
    onClick={() => setActiveTab('chat')}
    style={{
      background: activeTab === 'chat' ? '#22c55e' : '#f3f4f6',
      color: activeTab === 'chat' ? '#ffffff' : '#374151',
      border: 'none',
      padding: '0.7rem 1.1rem',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}
  >
    🤖 AI Advisory
  </button>

  {/* 5. ABOUT & TERMS (Positioned directly to the right) */}
  <button
    onClick={() => setActiveTab('about')}
    style={{
      background: activeTab === 'about' ? '#166534' : '#f3f4f6',
      color: activeTab === 'about' ? '#ffffff' : '#374151',
      border: 'none',
      padding: '0.7rem 1.1rem',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }}
  >
    ℹ️ About & Terms
  </button>
</nav>
      
      {/* =====================================================
          MAIN
      ====================================================== */}

      <main style={{ marginTop: '1rem' }}>

        {/* ===================================================
            AI CHAT
        ==================================================== */}

        {activeTab === 'chat' && (
          <div className="creative-section">

            <h3>
              🤖 InterOne AI Agricultural Assistant
            </h3>

            <p style={{ color: '#666' }}>
              Ask about market trends, direct sales,
              crop pricing, buyers or surplus produce.
            </p>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '15px',
                height: '420px',
                overflowY: 'auto',
                padding: '1rem',
                background:
                  'linear-gradient(135deg,#f0fdf4,#f8fafc)',
                marginBottom: '1rem'
              }}
            >

              {messages.map((m, idx) => (

                <div
                  key={idx}
                  style={{
                    textAlign:
                      m.sender === 'user'
                        ? 'right'
                        : 'left',

                    margin: '0.9rem 0'
                  }}
                >

                  <div
                    style={{
                      display: 'inline-block',
                      padding:
                        '0.7rem 1.1rem',
                      borderRadius:
                        '15px',

                      maxWidth: '85%',

                      textAlign: 'left',

                      background:
                        m.sender === 'user'
                          ? '#22c55e'
                          : '#ffffff',

                      color:
                        m.sender === 'user'
                          ? '#ffffff'
                          : '#1f2937',

                      boxShadow:
                        '0 3px 10px rgba(0,0,0,0.08)'
                    }}
                  >

                    {m.sender === 'user' ? (
                      <p
                        style={{
                          margin: 0
                        }}
                      >
                        {m.text}
                      </p>
                    ) : (
                      <ReactMarkdown>
                        {m.text}
                      </ReactMarkdown>
                    )}

                  </div>

                </div>

              ))}

              {loading && (
                <div
                  style={{
                    color: '#888',
                    fontStyle: 'italic',
                    padding: '10px'
                  }}
                >
                  🤖 InterOne AI is thinking...
                </div>
              )}

            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem'
              }}
            >

              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  sendMessage()
                }
                placeholder="Ask InterOne AI..."
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '10px',
                  border:
                    '1px solid #ccc'
                }}
              />

              <button
                onClick={sendMessage}
                style={{
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding:
                    '0.75rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Send 🚀
              </button>

            </div>

          </div>
        )}

        {/* ===================================================
            ZERO WASTE
        ==================================================== */}

        {activeTab === 'zero-waste' && (
          <div>

            <h3>
              ♻️ Zero-Waste Secondary Channel Finder
            </h3>

            <p style={{ color: '#666' }}>
              Turn surplus produce into another opportunity
              instead of letting it become waste.
            </p>

            <form
              className="zero-waste-form"
              onSubmit={handleZeroWasteSubmit}
              style={{
                background:
                  'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
                padding: '1.3rem',
                borderRadius: '15px',
                border:
                  '1px solid #bbf7d0',
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '1rem'
              }}
            >

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  🌱 Crop Name
                </label>

                <input
                  type="text"
                  value={crop}
                  onChange={(e) =>
                    setCrop(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border:
                      '1px solid #ccc',
                    marginTop: '0.3rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  ⚖️ Unsold Quantity (kg)
                </label>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border:
                      '1px solid #ccc',
                    marginTop: '0.3rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div className="zw-location-field">

                <label className="zw-field-label">
                  📍 Your Location
                </label>

                <div className="zw-location-row">

                  <input
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    placeholder="Enter village, town or district"
                    className="zw-modern-input"
                  />

                  <button
                    type="button"
                    className="zw-map-button"
                    onClick={() =>
                      openGoogleMaps(location)
                    }
                    disabled={!location.trim()}
                    title="Open this location in Google Maps"
                  >
                    📍 Maps
                  </button>

                </div>

                <span className="zw-location-hint">
                  Your location will be opened directly in Google Maps.
                </span>

              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  📦 Produce Condition
                </label>

                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border:
                      '1px solid #ccc',
                    marginTop: '0.3rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Fresh / Fresh Surplus">
                    Fresh / Fresh Surplus
                  </option>

                  <option value="Slightly Bruised / B-Grade">
                    Slightly Bruised / B-Grade
                  </option>

                  <option value="Overripe / Fast Perishing">
                    Overripe / Fast Perishing
                  </option>
                </select>
              </div>

              <div
                style={{
                  gridColumn:
                    'span 2'
                }}
              >

                <button
                  type="submit"
                  disabled={zwLoading}
                  style={{
                    width: '100%',
                    background:
                      zwLoading
                        ? '#86efac'
                        : '#16a34a',

                    color: 'white',
                    border: 'none',
                    padding: '0.8rem',
                    borderRadius: '10px',
                    cursor: zwLoading
                      ? 'wait'
                      : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  {zwLoading
                    ? '🚜 Finding Smart Channels...'
                    : '🚜 Start Smart Redirection'}
                </button>

              </div>

            </form>

            {/* GAME LOADING */}

            {zwLoading && (
              <div className="zero-waste-game">

                <div className="game-header">
                  <span>
                    🚜 SMART HARVEST LOGISTICS
                  </span>

                  <strong>
                    {zwProgress}%
                  </strong>
                </div>

                <div className="game-road">

                  <div className="game-sun">
                    ☀️
                  </div>

                  <div className="game-field">
                    🌾 🌾 🌾 🌾 🌾 🌾
                  </div>

                  <div
                    className={`game-tractor ${
                      zwStage === 'tractor'
                        ? 'tractor-moving'
                        : 'tractor-finished'
                    }`}
                  >
                    🚜
                  </div>

                  <div
                    className={`game-produce ${
                      zwProgress > 20
                        ? 'produce-loaded'
                        : ''
                    }`}
                  >
                    🥥 🥥 🥥
                  </div>

                  <div
                    className={`game-truck ${
                      zwStage === 'truck' ||
                      zwStage === 'complete'
                        ? 'truck-active'
                        : ''
                    }`}
                  >
                    🚚
                  </div>

                </div>

                <div className="game-message">

                  {zwStage === 'tractor' && (
                    <>
                      🚜 Tractor is collecting your
                      surplus produce...
                    </>
                  )}

                  {zwStage === 'loading' && (
                    <>
                      📦 Produce is being loaded
                      into the logistics truck...
                    </>
                  )}

                  {zwStage === 'truck' && (
                    <>
                      🚚 Truck is ready for smart
                      buyer redirection...
                    </>
                  )}

                  {zwStage === 'complete' && (
                    <>
                      🎉 100% Loaded! AI is preparing
                      your best zero-waste options...
                    </>
                  )}

                </div>

                <div className="game-progress-container">

                  <div
                    className="game-progress-bar"
                    style={{
                      width:
                        `${zwProgress}%`
                    }}
                  />

                </div>

                <div className="game-tips">

                  <span>🌾 Harvest</span>
                  <span>🚜 Collect</span>
                  <span>📦 Load</span>
                  <span>🚚 Redirect</span>
                  <span>🤖 AI</span>

                </div>

              </div>
            )}

            {/* RESULT */}

            {zwResult && !zwLoading && (
              <div
                className="zero-waste-result"
                style={{
                  marginTop: '1.5rem',
                  padding: '1.3rem',
                  border:
                    '1px solid #bbf7d0',
                  borderRadius: '15px',
                  background:
                    'linear-gradient(135deg,#ffffff,#f0fdf4)',
                  boxShadow:
                    '0 5px 20px rgba(34,197,94,0.12)',
                  lineHeight: '1.6'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '1rem'
                  }}
                >

                  <span
                    style={{
                      fontSize: '2rem'
                    }}
                  >
                    🎉
                  </span>

                  <div>

                    <strong
                      style={{
                        fontSize: '1.1rem',
                        color: '#15803d'
                      }}
                    >
                      Smart Redirection Complete
                    </strong>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: '0.85rem'
                      }}
                    >
                      AI has identified possible
                      zero-waste channels.
                    </div>

                  </div>

                </div>

                <ReactMarkdown>
                  {zwResult}
                </ReactMarkdown>

              </div>
            )}

          </div>
        )}

        {/* ===================================================
            MANDI
        ==================================================== */}

        {activeTab === 'mandi' && (
          <div>

            <h3>
              📊 Mandi Price Intelligence
            </h3>

            <p style={{ color: '#666' }}>
              Get realistic price benchmarks and
              multi-mandi rate comparisons.
            </p>

            <form
              className="mandi-modern-form"
              onSubmit={handleMandiSubmit}
              style={{
                background:
                  '#f0fdf4',
                padding: '1.2rem',
                borderRadius: '12px',
                border:
                  '1px solid #bbf7d0',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end',
                flexWrap: 'wrap'
              }}
            >

              <div
                style={{
                  flex: 1,
                  minWidth: '200px'
                }}
              >

                <label
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  Crop Name
                </label>

                <input
                  type="text"
                  value={mandiCrop}
                  onChange={(e) =>
                    setMandiCrop(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '7px',
                    border:
                      '1px solid #ccc',
                    marginTop: '0.3rem',
                    boxSizing: 'border-box'
                  }}
                />

              </div>

              <div className="mandi-location-field">

                <label className="mandi-field-label">
                  📍 Mandi / Location
                </label>

                <div className="mandi-location-row">

                  <input
                    type="text"
                    value={mandiLocation}
                    onChange={(e) =>
                      setMandiLocation(e.target.value)
                    }
                    placeholder="Enter mandi or location"
                    className="mandi-modern-input"
                  />

                  <button
                    type="button"
                    className="mandi-map-button"
                    onClick={() =>
                      openGoogleMaps(
                        mandiLocation
                      )
                    }
                    disabled={
                      !mandiLocation.trim()
                    }
                    title="Open location in Google Maps"
                  >
                    📍 Maps
                  </button>

                </div>

              </div>

              <button
                type="submit"
                disabled={mandiLoading}
                style={{
                  background:
                    '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding:
                    '0.7rem 1.2rem',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {mandiLoading
                  ? '🤖 Analyzing...'
                  : '📊 Fetch Market Intel'}
              </button>

            </form>

            {mandiReport && (
              <div
                className="mandi-report-modern"
                style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: '12px',
                  background:
                    '#ffffff',
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.05)',
                  lineHeight: '1.6'
                }}
              >
                <ReactMarkdown>
                  {mandiReport}
                </ReactMarkdown>
              </div>
            )}

          </div>
        )}
        {/* ===================================================
            MARKETPLACE
        ==================================================== */}

        {activeTab === 'marketplace' && (
          <div>

            <h3>
              🛒 Direct Wholesale Produce Marketplace
            </h3>

            <p style={{ color: '#666' }}>
              Post harvested crops for direct sale
              or discover active farmer listings.
            </p>

            {/* MARKETPLACE FORM */}

            <form
              className="marketplace-form"
              onSubmit={handleCreateListing}
              style={{
                background:
                  'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
                padding: '1.2rem',
                borderRadius: '14px',
                border: '1px solid #bbf7d0',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >

              {/* FARMER NAME */}

              <div className="marketplace-field">

                <label htmlFor="farmer-name">
                  👨‍🌾 Farmer Name
                </label>

                <input
                  id="farmer-name"
                  type="text"
                  required
                  value={farmerName}
                  onChange={(e) =>
                    setFarmerName(e.target.value)
                  }
                  placeholder="e.g. Arumugam"
                />

              </div>

              {/* CROP */}

              <div className="marketplace-field">

                <label htmlFor="list-crop">
                  🌱 Crop Name
                </label>

                <input
                  id="list-crop"
                  type="text"
                  required
                  value={listCrop}
                  onChange={(e) =>
                    setListCrop(e.target.value)
                  }
                  placeholder="e.g. Red Onion"
                />

              </div>

              {/* QUANTITY */}

              <div className="marketplace-field">

                <label htmlFor="list-qty">
                  ⚖️ Available Qty (kg)
                </label>

                <input
                  id="list-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={listQty}
                  onChange={(e) =>
                    setListQty(e.target.value)
                  }
                  placeholder="e.g. 1000"
                />

              </div>

              {/* PRICE */}

              <div className="marketplace-field">

                <label htmlFor="list-price">
                  💰 Asking Price (₹/kg)
                </label>

                <input
                  id="list-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={listPrice}
                  onChange={(e) =>
                    setListPrice(e.target.value)
                  }
                  placeholder="e.g. 35"
                />

              </div>

              
              {/* LOCATION */}

              <div className="marketplace-field">

                <label htmlFor="list-location">
                    📍 Seller Location
                </label>

              <div
                style={{
                 display: 'flex',
                  gap: '0.5rem',
                   alignItems: 'stretch',
                  width: '100%'
                  }}
                 >

                     <input
                   id="list-location"
                 type="text"
                        value={listLoc}
                        onChange={(e) =>
                       setListLoc(e.target.value)
                        }
                          placeholder="Enter location or use GPS"
                          style={{
                     flex: 1,
                     minWidth: 0
                          }}
                         />

                  <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                title="Use current GPS location"
                style={{
                  background: locationLoading ? '#86efac' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  cursor: locationLoading ? 'wait' : 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem'
                }}
              >
                {locationLoading ? '⏳...' : '📍 GPS'}
              </button>
              </div>

  <small
    style={{
      display: 'block',
      marginTop: '0.35rem',
      color: '#6b7280'
    }}
  >
    Use GPS to automatically capture your current location.
  </small>

</div>
              {/* CONTACT */}

              <div className="marketplace-field">

                <label htmlFor="list-contact">
                  📞 Contact No
                </label>

                <input
                  id="list-contact"
                  type="tel"
                  value={listContact}
                  onChange={(e) =>
                    setListContact(e.target.value)
                  }
                  placeholder="e.g. 9876543210"
                />

              </div>

              {/* PRODUCE IMAGE */}
          <div
            className="marketplace-field"
            style={{
              gridColumn: '1/-1'
            }}
          >
            <label style={{ fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              📷 Produce Image
            </label>
            
            <div
              onClick={() => document.getElementById('produce-image-input').click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                border: '2px dashed #86efac',
                borderRadius: '12px',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
            >
              <input
                id="produce-image-input"
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => {
                  if (typeof handleImageChange === 'function') {
                    handleImageChange(e)
                  }
                }}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 6px rgba(34,197,94,0.3)'
                  }}
                >
                  📁 Select Photo
                </span>
                <span
                  style={{
                    color: imagePreview ? '#15803d' : '#6b7280',
                    fontSize: '0.85rem',
                    fontWeight: imagePreview ? 'bold' : 'normal'
                  }}
                >
                  {imagePreview ? '✓ Photo Attached' : 'Choose a file...'}
                </span>
              </div>

              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                JPG, PNG, WEBP (Max 2MB)
              </span>
            </div>

            {imagePreview && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.9rem',
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0'
                }}
              >
                <img
                  src={imagePreview}
                  alt="Produce preview"
                  style={{
                    width: '45px',
                    height: '45px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #86efac'
                  }}
                />
                <div style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Image selected and ready to post!
                </div>
              </div>
            )}
          </div>

              {/* SUBMIT */}

              <div
                className="marketplace-submit"
                style={{
                  gridColumn:
                    '1 / -1',
                  width: '100%'
                }}
              >

                <button
                  className="marketplace-submit-button"
                  type="submit"
                  disabled={imageUploading}
                  style={{
                    width: '100%',
                    background:
                      imageUploading
                        ? '#86efac'
                        : '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '9px',
                    cursor: imageUploading
                      ? 'wait'
                      : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  {imageUploading
                    ? '📷 Uploading Image...'
                    : '🚜 + Post Produce Listing'}
                </button>

              </div>

            </form>

            {/* ACTIVE LISTINGS */}

            <h4
              style={{
                marginBottom: '1rem'
              }}
            >
              🛍️ Active Direct Produce Listings
              ({listings.length})
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(min(280px, 100%),1fr))',
                gap: '1rem'
              }}
            >

              {listings.map((item) => (

                <div
                  key={item.id}
                  style={{
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1rem',
                    background:
                      '#ffffff',
                    boxShadow:
                      '0 3px 10px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >

                  {/* PRODUCT IMAGE */}

                  {item.image_path ? (
  <img
    src={
      item.image_path.startsWith('data:') || item.image_path.startsWith('http')
        ? item.image_path
        : `${API_BASE_URL}${item.image_path}`
    }
    alt={`${item.crop_name} produce`}
    onClick={() => handleProductImageClick(item)}
    title="Click to visually analyse this product"
    style={{
      width: '100%',
      height: '190px',
      objectFit: 'cover',
      borderRadius: '10px',
      marginBottom: '0.9rem',
      display: 'block',
      cursor: 'pointer'
    }}
  />
) : (
                    <div
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: '10px',
                        background:
                          'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        marginBottom: '0.9rem'
                      }}
                    >
                      🌱
                    </div>
                  )}

                  {/* CROP + PRICE */}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      gap: '0.5rem'
                    }}
                  >

                    <h4
                      style={{
                        margin: 0,
                        color:
                          '#15803d'
                      }}
                    >
                      {item.crop_name}
                    </h4>

                    <span
                      style={{
                        background:
                          '#dcfce7',
                        color:
                          '#15803d',
                        padding:
                          '0.3rem 0.6rem',
                        borderRadius:
                          '12px',
                        fontSize:
                          '0.85rem',
                        fontWeight:
                          'bold'
                      }}
                    >
                      ₹
                      {item.price_per_kg}
                      /kg
                    </span>

                  </div>

                  <p
                    style={{
                      fontSize:
                        '0.9rem',
                      color:
                        '#374151'
                    }}
                  >
                    👨‍🌾{' '}
                    <strong>
                      {item.farmer_name}
                    </strong>
                  </p>

                  <p
                    style={{
                      fontSize:
                        '0.85rem',
                      color:
                        '#6b7280'
                    }}
                  >
                    ⚖️ {item.quantity_kg} kg
                  </p>

                  <p
                    style={{
                      fontSize:
                        '0.85rem',
                      color:
                        '#6b7280'
                    }}
                  >
                    📍 {item.location}
                  </p>

                 <div
  style={{
    marginTop: '1rem',
    paddingTop: '0.8rem',
    borderTop: '1px solid #f3f4f6'
  }}
>

  {/* BUYER ACTION MESSAGE */}

  <div
    style={{
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.7rem'
    }}
  >
    🤝 Interested in this produce?
  </div>

  {/* ACTION BUTTONS */}

  <div
    style={{
      display: 'flex',
      gap: '0.6rem',
      flexWrap: 'wrap'
    }}
  >

    {/* CONTACT FARMER */}

    <button
      onClick={() =>
        alert(
          `🤝 Connecting you with ${item.farmer_name}\n\n📞 Contact: ${item.contact}\n🌱 Produce: ${item.crop_name}\n⚖️ Quantity: ${item.quantity_kg} kg\n💰 Price: ₹${item.price_per_kg}/kg`
        )
      }
      style={{
        flex: 1,
        minWidth: '140px',
        background: '#22c55e',
        color: 'white',
        border: 'none',
        padding: '0.65rem 0.8rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      📞 Contact Farmer
    </button>

    {/* VIEW LOCATION */}
<button
  onClick={() => {
    if (
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined
    ) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
        '_blank',
        'noopener,noreferrer'
      )
    } else {
      openGoogleMaps(item.location)
    }
  }}
  style={{
    flex: 1,
    minWidth: '120px',
    background: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    padding: '0.65rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }}
>
  📍 View Location
</button>

  </div>

</div>
                </div>

              ))}

              {listings.length === 0 && (
                <div
                  style={{
                    gridColumn:
                      '1 / -1',
                    textAlign:
                      'center',
                    padding:
                      '2rem',
                    color:
                      '#6b7280',
                    background:
                      '#f9fafb',
                    borderRadius:
                      '12px'
                  }}
                >
                  🌱 No active listings yet.
                  <br />
                  Be the first farmer to
                  post your produce!
                </div>
              )}

            </div>

          </div>
        )}
{activeTab === 'about' && (
  <div
    style={{
      position: 'relative',
      background: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      marginTop: '1.5rem',
      height: '520px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0'
    }}
  >
    {/* SCROLLABLE TEXT CONTAINER */}
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '2rem',
        paddingRight: '230px',
        color: '#1e293b'
      }}
    >
      {/* HEADER */}
      <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#166534', margin: 0, fontSize: '1.6rem' }}>
          🌾 About InterOne Smart Marketplace
        </h2>
        <p style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          An end-to-end AI-powered agricultural decision intelligence platform designed <b> to eliminate middleman exploitation and reduce post-harvest crop loss.</b>  
        </p>
      </div>

      {/* CORE FEATURES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ color: '#166534', marginTop: 0, marginBottom: '0.4rem' }}>🤖 1. AI Advisory Assistant</h4>
          <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            An interactive agronomic decision engine powered by generative AI. Offers instant advice on crop health, selling strategies, and pest diagnostics.
          </p>
        </div>

        <div style={{ background: '#ecfdf5', padding: '1.2rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <h4 style={{ color: '#047857', marginTop: 0, marginBottom: '0.4rem' }}>♻️ 2. Zero-Waste Redirection</h4>
          <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            Directs surplus or B-grade produce to alternative buyers—including food processing units, animal feed producers, and bio-energy operations.
          </p>
        </div>

        <div style={{ background: '#eff6ff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ color: '#1d4ed8', marginTop: 0, marginBottom: '0.4rem' }}>📊 3. Market Price Intelligence</h4>
          <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            Delivers regional price benchmarks, neighboring market comparisons, and 7-day trend forecasts to give farmers pricing leverage.
          </p>
        </div>

       <div style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
  <h4 style={{ color: '#15803d', marginTop: 0, marginBottom: '0.4rem' }}>🛒 4. Direct Wholesale Marketplace</h4>
  <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
    Enables farmers to post fresh produce listings with automated GPS location tracking, direct contact options, and automatic 3-day post expirations.
  </p>
</div>      </div>

      {/* TERMS AND CONDITIONS */}
      <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
        <h4 style={{ color: '#475569', marginTop: 0, marginBottom: '0.6rem' }}>📋 Terms of Use & Platform Guidelines</h4>
        <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.7 }}>
          <li><b>Prototype Status:</b> Developed as a prototype solution for Smart India Hackathon (SIH) evaluation.</li>
          <li><b>3-Day Expiry Rule:</b> All listings automatically expire and clear after 72 hours to guarantee active, fresh produce inventory.</li>
          <li><b>AI Advisory Benchmark:</b> Price estimations and zero-waste buyer recommendations serve as advisory insights provided via AI models.</li>
          <li><b>Privacy Protection:</b> Shared GPS locations and images are exclusively used for connecting direct local buyers and sellers.</li>
        </ul>
      </div>
    </div>

    {/* STATIC MASCOT PINNED TO BOTTOM RIGHT */}
    <img
      src={farmerMascot}
      alt="Farmer Guide Mascot"
      style={{
        position: 'absolute',
        bottom: '0',
        right: '10px',
        width: '220px',
        height: 'auto',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  </div>
)}
      </main>

     {/* DRAGGABLE AI FARMER POPUP */}
{showFarmerPopup && !showProductAnalysis && (
  <div
    style={{
      position: 'fixed',
      left: `${popupPos.x}px`,
      top: `${popupPos.y}px`,
      zIndex: 9999,
      userSelect: 'none'
    }}
  >
    <div
      onMouseDown={handleMouseDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.8rem 0.8rem 0.6rem',
        width: '210px',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        border: '1.5px solid #86efac',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative'
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowFarmerPopup(false)
          setFarmerPopupClosed(true)
        }}
        aria-label="Close AI Farmer"
        style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          background: 'none',
          border: 'none',
          fontSize: '1.2rem',
          cursor: 'pointer',
          color: '#6b7280',
          zIndex: 10
        }}
      >
        ×
      </button>

      {/* 1. SPEECH BUBBLE */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #22c55e',
          borderRadius: '12px',
          padding: '0.5rem 0.6rem',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          position: 'relative',
          marginBottom: '0.5rem',
          textAlign: 'center',
          width: '90%'
        }}
      >
        <strong style={{ display: 'block', color: '#15803d', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
          {currentFarmerMessage?.title || 'InterOne AI Assistant'}
        </strong>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.7rem', lineHeight: '1.3' }}>
          {currentFarmerMessage?.message || 'Ask me about crop prices, selling strategies, or zero-waste channels!'}
        </p>

        {/* POINTER TRIANGLE */}
        <div
          style={{
            position: 'absolute',
            bottom: '-7px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid #22c55e'
          }}
        />
      </div>

      {/* 2. FARMER IMAGE */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '0.1rem 0 0.4rem' }}>
        <img
          src="/farmer-ai.png"
          alt="InterOne AI Farmer"
          style={{
            height: '125px',
            objectFit: 'contain',
            filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))'
          }}
          draggable={false}
        />
      </div>

      {/* 3. BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setActiveTab('chat')
          setShowFarmerPopup(false)
        }}
        style={{
          width: '100%',
          background: '#16a34a',
          color: 'white',
          border: 'none',
          padding: '0.5rem',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '0.78rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
        }}
      >
        {currentFarmerMessage?.button || '🤖 Ask InterOne'}
      </button>
    </div>
  </div>
)}


      {/* =====================================================
          PRODUCT ANALYSIS POPUP
      ====================================================== */}

      {showProductAnalysis && (
        <div className="ai-farmer-container">

          <div className="ai-farmer-popup">

            <button
              className="ai-farmer-close"
              onClick={closeProductAnalysis}
              aria-label="Close Product Analysis"
            >
              ×
            </button>

            {/* ANALYSIS MESSAGE */}

            <div className="ai-farmer-analysis-message">

              <strong>
                💬 Do you want me to visually analyse this product?
              </strong>

              <p>
                I can check its visible quality,
                freshness and possible issues.
              </p>

            </div>

            {/* FARMER */}

            <div className="ai-farmer-character">

              <img
                src="/farmer-ai.png"
                alt="InterOne AI Farmer"
              />

            </div>

            {/* ANALYSE BUTTON */}

            {!productAnalysis && (
              <button
                className="ai-farmer-analyse-button"
                onClick={handleAnalyzeProduct}
                disabled={productAnalysisLoading}
              >
                {productAnalysisLoading
                  ? '🤖 Analysing...'
                  : '🔎 Analyse Product'}
              </button>
            )}

            {/* ANALYSIS RESULT */}

            {productAnalysis && (
              <div
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginTop: '0.8rem',
                  padding: '0.9rem',
                  boxSizing: 'border-box',
                  border:
                    '1px solid #bbf7d0',
                  borderRadius: '12px',
                  background:
                    '#f0fdf4',
                  textAlign: 'left',
                  lineHeight: '1.5',
                  fontSize: '0.85rem'
                }}
              >

                <div
                  style={{
                    fontWeight: 'bold',
                    color: '#15803d',
                    marginBottom: '0.5rem'
                  }}
                >
                  🤖 InterOne Visual Analysis
                </div>

                <ReactMarkdown>
                  {productAnalysis}
                </ReactMarkdown>

                <button
                  onClick={closeProductAnalysis}
                  style={{
                    width: '100%',
                    marginTop: '0.7rem',
                    padding: '0.6rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Close Analysis
                </button>

              </div>
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          FLOATING AI FARMER
      ====================================================== */}

      {farmerPopupClosed &&
        !showFarmerPopup &&
        !showProductAnalysis && (
          <button
            className="ai-farmer-floating"
            onClick={() =>
              setShowFarmerPopup(true)
            }
            title="Open InterOne AI Farmer"
            aria-label="Open InterOne AI Farmer"
          >

            <img
              src="/farmer-ai.png"
              alt="Open InterOne AI Farmer"
            />

          </button>
        )}

    </div>
  )
}



export default App