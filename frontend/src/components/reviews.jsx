import React, { useState, useEffect } from 'react';
import '../resources/reviews.css';

const reviewsData = [
  {
    id: 1,
    name: "Mwila Banda",
    rating: 5,
    comment: "Quick, easy, and reliable booking. The interface is intuitive and the whole process was seamless. Highly recommend!",
    date: "2 days ago",
    avatar: "MB"
  },
  {
    id: 2,
    name: "Chanda Phiri",
    rating: 5,
    comment: "Super-fast checkout—no hiccups. Payment was secure and I received instant confirmation. Great service!",
    date: "1 week ago",
    avatar: "CP"
  },
  {
    id: 3,
    name: "Mutale Musonda",
    rating: 4,
    comment: "Loved the intuitive interface. Easy to find buses and compare prices. The booking process was straightforward.",
    date: "3 days ago",
    avatar: "MM"
  },
  {
    id: 4,
    name: "Mwansa Kapeya",
    rating: 5,
    comment: "Instant confirmation, very happy. Real-time updates kept me informed throughout my journey. Excellent platform!",
    date: "5 days ago",
    avatar: "MK"
  },
  {
    id: 5,
    name: "Chileshe Kalumba",
    rating: 5,
    comment: "Seamless experience every time. Customer support is responsive and helpful. Will definitely use again!",
    date: "1 week ago",
    avatar: "CK"
  },
  {
    id: 6,
    name: "Lombe Chisala",
    rating: 4,
    comment: "Got my ticket in seconds. The mobile app works perfectly and the seat selection feature is very convenient.",
    date: "4 days ago",
    avatar: "LC"
  },
  {
    id: 7,
    name: "Phiri Mulenga",
    rating: 5,
    comment: "Smooth payment and seat selection. Multiple payment options available and the process is very secure.",
    date: "6 days ago",
    avatar: "PM"
  },
  {
    id: 8,
    name: "Kalumba Kapungwe",
    rating: 5,
    comment: "Fantastic customer support. They resolved my issue quickly and professionally. Top-notch service!",
    date: "1 week ago",
    avatar: "KK"
  },
  {
    id: 9,
    name: "Bwalya Mumba",
    rating: 4,
    comment: "The app is generally good, but sometimes the map feature lags. Booking is always reliable though.",
    date: "10 days ago",
    avatar: "BM"
  },
  {
    id: 10,
    name: "Ngonde Zulu",
    rating: 5,
    comment: "Booking tickets has never been easier! Love the simplicity and the clear layout. No more long queues!",
    date: "23 days ago",
    avatar: "NZ"
  },
  {
    id: 11,
    name: "Sitali Sibeso",
    rating: 5,
    comment: "A lifesaver for last-minute travel plans. Always find seats even during peak times. Highly recommended!",
    date: "15 days ago",
    avatar: "SS"
  },
  {
    id: 12,
    name: "Mukuka Chola",
    rating: 3,
    comment: "Decent app, but experienced a small glitch during payment once. It eventually went through, but was a bit worrying.",
    date: "28 days ago",
    avatar: "MC"
  },
  {
    id: 13,
    name: "Esau Sakala",
    rating: 5,
    comment: "Excellent platform! I appreciate the various payment options and how quickly I get my e-ticket.",
    date: "7 days ago",
    avatar: "ES"
  },
  {
    id: 14,
    name: "Lubasi Mwape",
    rating: 4,
    comment: "Very user-friendly. Finding bus routes and times is very intuitive. Minor suggestions for more filter options.",
    date: "18 days ago",
    avatar: "LM"
  },
  {
    id: 15,
    name: "Taonga Nkandu",
    rating: 5,
    comment: "This app makes travel planning a breeze. From selection to payment, it’s all seamless. Great job!",
    date: "11 days ago",
    avatar: "TN"
  },
  {
    id: 16,
    name: "Kazadi Chama",
    rating: 5,
    comment: "Reliable and efficient. I always use this service for my inter-city travels. Never had an issue.",
    date: "25 days ago",
    avatar: "KC"
  },
  {
    id: 17,
    name: "Sepiso Mwale",
    rating: 4,
    comment: "Good app overall. The booking process is quick. Sometimes it takes a moment to load bus details.",
    date: "13 days ago",
    avatar: "SM"
  },
  {
    id: 18,
    name: "Kasonde Lengwe",
    rating: 5,
    comment: "Absolutely fantastic! The real-time seat availability is a game-changer. So convenient.",
    date: "6 days ago",
    avatar: "KL"
  },
  {
    id: 19,
    name: "Malama Mwewa",
    rating: 5,
    comment: "Effortless booking from start to finish. I love how easy it is to manage my bookings.",
    date: "29 days ago",
    avatar: "MM"
  },
  {
    id: 20,
    name: "Mukwanda Gondwe",
    rating: 4,
    comment: "Solid performance. Tickets are delivered promptly. Would love to see more routes added in future.",
    date: "20 days ago",
    avatar: "MG"
  },
  {
    id: 21,
    name: "Mapalo Nachula",
    rating: 5,
    comment: "This is my go-to app for bus tickets. User interface is clean and functions perfectly. Always a smooth ride.",
    date: "4 days ago",
    avatar: "MN"
  },
  {
    id: 22,
    name: "Chifundo Tembo",
    rating: 5,
    comment: "The best online ticket platform I've used. Secure payments and instant confirmations make it worry-free.",
    date: "17 days ago",
    avatar: "CT"
  },
  {
    id: 23,
    name: "Thabo Nyirenda",
    rating: 3,
    comment: "The app works, but it crashed once when I tried to select seats. Re-opened and it was fine.",
    date: "22 days ago",
    avatar: "TN"
  },
  {
    id: 24,
    name: "Simeon Lungu",
    rating: 5,
    comment: "Fast, simple, and reliable. Exactly what you need for bus ticket booking. Highly satisfied!",
    date: "9 days ago",
    avatar: "SL"
  },
  {
    id: 25,
    name: "Priscilla Chileshe",
    rating: 4,
    comment: "Good experience overall. Easy to navigate. Some bus operator details could be more comprehensive.",
    date: "26 days ago",
    avatar: "PC"
  },
  {
    id: 26,
    name: "Luwisha Banda",
    rating: 5,
    comment: "A fantastic app for travelers! It saves so much time and effort. I always get the best deals here.",
    date: "14 days ago",
    avatar: "LB"
  },
  {
    id: 27,
    name: "Mwansa Zulu",
    rating: 5,
    comment: "User-friendly interface and very quick booking process. The notifications are also very helpful.",
    date: "3 days ago",
    avatar: "MZ"
  },
  {
    id: 28,
    name: "Nandi Phiri",
    rating: 4,
    comment: "It's a very functional app. I wish there was a dark mode option, but other than that, it's great.",
    date: "19 days ago",
    avatar: "NP"
  },
  {
    id: 29,
    name: "Chisomo Mwale",
    rating: 5,
    comment: "Seamless payment gateway and instant ticket delivery. A truly modern and convenient booking experience.",
    date: "8 days ago",
    avatar: "CM"
  },
  {
    id: 30,
    name: "Kabwe Mwamba",
    rating: 5,
    comment: "Highly efficient and reliable. I've used it multiple times and it never disappoints. Thumbs up!",
    date: "27 days ago",
    avatar: "KM"
  },
  {
    id: 31,
    name: "Mizinga Chama",
    rating: 4,
    comment: "Very intuitive design, easy to book tickets. Sometimes the bus arrival times are not perfectly accurate.",
    date: "16 days ago",
    avatar: "MC"
  },
  {
    id: 32,
    name: "Chipoya Sakala",
    rating: 5,
    comment: "Excellent application! It has simplified my travel arrangements immensely. So convenient.",
    date: "5 days ago",
    avatar: "CS"
  },
  {
    id: 33,
    name: "Lubuto Nkandu",
    rating: 5,
    comment: "Quick and hassle-free booking. I particularly like the ease of comparing different bus companies.",
    date: "24 days ago",
    avatar: "LN"
  },
  {
    id: 34,
    name: "Bupe Daka",
    rating: 4,
    comment: "Good app, generally works well. Found a minor issue with the date picker on older devices, but it fixed itself.",
    date: "21 days ago",
    avatar: "BD"
  },
  {
    id: 35,
    name: "Mweemba Sikalumbi",
    rating: 5,
    comment: "I love the ticket cancellation feature! It's very flexible and understanding when plans change.",
    date: "12 days ago",
    avatar: "MS"
  },
  {
    id: 36,
    name: "Nkumbu Mwale",
    rating: 5,
    comment: "A must-have for frequent travelers. It saves so much time and provides all necessary information.",
    date: "1 day ago",
    avatar: "NM"
  },
  {
    id: 37,
    name: "Chisenga Ngoma",
    rating: 3,
    comment: "Navigation can be a bit confusing at times, especially for first-time users. Otherwise, functional.",
    date: "30 days ago",
    avatar: "CN"
  },
  {
    id: 38,
    name: "Mulenga Kabwe",
    rating: 5,
    comment: "Booking confirmed in seconds! The app's design is very modern and user-friendly. Absolutely satisfied.",
    date: "9 days ago",
    avatar: "MK"
  },
  {
    id: 39,
    name: "Kunda Bwalya",
    rating: 4,
    comment: "Smooth transaction process. Sometimes the seat map loads slowly, but not a major issue.",
    date: "17 days ago",
    avatar: "KB"
  },
  {
    id: 40,
    name: "Nchimunya Mudenda",
    rating: 5,
    comment: "Top-notch customer service, always ready to assist. The booking itself is flawless.",
    date: "6 days ago",
    avatar: "NM"
  },
  {
    id: 41,
    name: "Zambezi Chibwe",
    rating: 5,
    comment: "This app is a game-changer for bus travel. No more queues or physical tickets. Everything is digital and convenient.",
    date: "28 days ago",
    avatar: "ZC"
  },
  {
    id: 42,
    name: "Lungu Mwape",
    rating: 4,
    comment: "Generally good. I'd like more options for public transport within cities, but for intercity, it's perfect.",
    date: "23 days ago",
    avatar: "LM"
  },
  {
    id: 43,
    name: "Nakonde Tembo",
    rating: 5,
    comment: "Saved me so much time! I can book tickets from anywhere. A truly indispensable app for travelers.",
    date: "10 days ago",
    avatar: "NT"
  },
  {
    id: 44,
    name: "Mpundu Soko",
    rating: 5,
    comment: "The booking steps are clear and concise. Even my grandmother could use it! Very intuitive.",
    date: "15 days ago",
    avatar: "MS"
  },
  {
    id: 45,
    name: "Tafadzwa Banda",
    rating: 3,
    comment: "It does the job, but sometimes the app feels a bit sluggish on my older phone. Needs some optimization.",
    date: "25 days ago",
    avatar: "TB"
  },
  {
    id: 46,
    name: "Kasuba Kapasa",
    rating: 5,
    comment: "Love the feature that allows me to view bus amenities before booking. Very helpful!",
    date: "2 days ago",
    avatar: "KK"
  },
  {
    id: 47,
    name: "Zani Phiri",
    rating: 4,
    comment: "Reliable and easy to use. The ticket details are always clear. Just a slight delay in loading schedules sometimes.",
    date: "18 days ago",
    avatar: "ZP"
  },
  {
    id: 48,
    name: "Chikondi Zulu",
    rating: 5,
    comment: "The real-time notifications about departures and arrivals are incredibly useful. Keeps me on track.",
    date: "11 days ago",
    avatar: "CZ"
  },
  {
    id: 49,
    name: "Mali Chibwe",
    rating: 5,
    comment: "Secure payment system and instant ticket delivery. Couldn't ask for more. Highly recommend this app!",
    date: "7 days ago",
    avatar: "MC"
  },
  {
    id: 50,
    name: "Maswabi Banda",
    rating: 4,
    comment: "Convenient app, though I had trouble applying a discount code once. Customer support helped me out quickly.",
    date: "29 days ago",
    avatar: "MB"
  },
  {
    id: 51,
    name: "Inonge Sifuwe",
    rating: 5,
    comment: "This app has made my life so much easier. Booking tickets is no longer a chore, it's a pleasure!",
    date: "20 days ago",
    avatar: "IS"
  },
  {
    id: 52,
    name: "Siame Mweemba",
    rating: 5,
    comment: "The bus schedules are always up-to-date, which is great. No more missing buses!",
    date: "16 days ago",
    avatar: "SM"
  },
  {
    id: 53,
    name: "Miyanda Lungu",
    rating: 4,
    comment: "Solid functionality. The search filters are very effective. Perhaps a few more language options would be nice.",
    date: "24 days ago",
    avatar: "ML"
  },
  {
    id: 54,
    name: "Namakau Chama",
    rating: 5,
    comment: "Fantastic user experience. From planning to execution, this app handles everything perfectly.",
    date: "13 days ago",
    avatar: "NC"
  },
  {
    id: 55,
    name: "Likando Nyambe",
    rating: 5,
    comment: "I appreciate the detailed information about bus stops and routes. Very helpful for planning.",
    date: "26 days ago",
    avatar: "LN"
  },
  {
    id: 56,
    name: "Chiti Simfukwe",
    rating: 4,
    comment: "Good app, sometimes the ticket download takes a bit long. Otherwise, very reliable.",
    date: "19 days ago",
    avatar: "CS"
  },
  {
    id: 57,
    name: "Mutinta Sichone",
    rating: 5,
    comment: "The best bus ticket app out there! So convenient for booking and managing trips on the go.",
    date: "8 days ago",
    avatar: "MS"
  },
  {
    id: 58,
    name: "Sikazwe Chanda",
    rating: 5,
    comment: "The customer service chat feature is a godsend. Quick responses and always helpful. Thank you!",
    date: "27 days ago",
    avatar: "SC"
  },
  {
    id: 59,
    name: "Sekani Banda",
    rating: 4,
    comment: "It works well, but sometimes I wish there were more low-cost options available.",
    date: "2 days ago",
    avatar: "SB"
  },
  {
    id: 60,
    name: "Misozi Phiri",
    rating: 5,
    comment: "My go-to for all travel bookings. Simple, fast, and secure. Highly recommend to everyone!",
    date: "14 days ago",
    avatar: "MP"
  },
  {
    id: 61,
    name: "Yolanta Daka",
    rating: 5,
    comment: "The best feature is being able to change seats after booking. So flexible and convenient!",
    date: "5 days ago",
    avatar: "YD"
  },
  {
    id: 62,
    name: "Chifuniro Mwila",
    rating: 4,
    comment: "User interface is mostly clean. I sometimes find the search results a bit cluttered, but still functional.",
    date: "21 days ago",
    avatar: "CM"
  },
  {
    id: 63,
    name: "Niza Phiri",
    rating: 5,
    comment: "Incredibly useful! Always find the best routes and times. Booking is a breeze and tickets are instant.",
    date: "11 days ago",
    avatar: "NP"
  }
];

function Reviews() {
  const [currentReviews, setCurrentReviews] = useState([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);

  // Fetch 4 random reviews
  const fetchRandomReviews = () => {
    const shuffled = [...reviewsData].sort(() => 0.5 - Math.random());
    setCurrentReviews(shuffled.slice(0, 4));
  };

  // Get next 4 reviews
  const getNext4Reviews = () => {
    const nextIndex = (currentStartIndex + 4) % reviewsData.length;
    const nextReviews = [];
    
    for (let i = 0; i < 4; i++) {
      const index = (nextIndex + i) % reviewsData.length;
      nextReviews.push(reviewsData[index]);
    }
    
    setCurrentReviews(nextReviews); 
    setCurrentStartIndex(nextIndex);
  };

  // Get previous 4 reviews
  const getPrev4Reviews = () => {
    const prevIndex = (currentStartIndex - 4 + reviewsData.length) % reviewsData.length;
    const prevReviews = [];
    
    for (let i = 0; i < 4; i++) {
      const index = (prevIndex + i) % reviewsData.length;
      prevReviews.push(reviewsData[index]);
    }
    
    setCurrentReviews(prevReviews);
    setCurrentStartIndex(prevIndex);
  };

  // Initialize with first 4 reviews
  useEffect(() => {
    setCurrentReviews(reviewsData.slice(0, 4));
    setCurrentStartIndex(0);
  }, []);

  // Auto-rotate reviews every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getNext4Reviews();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentStartIndex]);

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span 
        key={index} 
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2>What Our Customers Say</h2>
        <p>Real experiences from real travelers</p>
      </div>
      
      <div className="reviews-container">
        <button className="nav-button prev" onClick={getPrev4Reviews}>
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <div className="reviews-grid">
          {currentReviews.map((review, index) => (
            <div key={`${review.id}-${index}`} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="avatar">{review.avatar}</div>
                  <div className="reviewer-details">
                    <h4 className="reviewer-name">{review.name}</h4>
                    <span className="review-date">{review.date}</span>
                  </div>
                </div>
                <div className="rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <div className="review-content">
                <p className="review-text">{review.comment}</p>
              </div>
              
              <div className="review-footer">
                <span className="verified-badge">
                  <i className="fas fa-check-circle"></i>
                  Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <button className="nav-button next" onClick={getNext4Reviews}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div className="reviews-indicators">
        {Array.from({ length: Math.ceil(reviewsData.length / 4) }, (_, index) => (
          <span 
            key={index} 
            className={`indicator ${Math.floor(currentStartIndex / 4) === index ? 'active' : ''}`}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Reviews;