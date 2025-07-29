import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Mic, Send } from "lucide-react";

const socket = io("https://aichatbot-sever.onrender.com");

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setMessage("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const newMessage = {
      userMessage: trimmedMessage,
      aiMessage: "",
      timestamp: new Date().toISOString(),
    };

    socket.emit("userMessage", { message: trimmedMessage });
    setChatMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setLoading(true);
  };

  useEffect(() => {
    socket.on("aiMessage", (data) => {
      setChatMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, aiMessage: data.aiMessage }
            : msg
        )
      );
      setLoading(false);
    });

    socket.on("errorMessage", (data) => {
      console.error(" Server Error:", data.error);
      setLoading(false);
    });

    return () => {
      socket.off("aiMessage");
      socket.off("errorMessage");
    };
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, loading]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white font-sans">
      {/* Chat Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gray-950"
      >
        {chatMessages.map((msg, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-end items-start gap-2">
              <div className="bg-blue-600 px-4 py-2 rounded-xl max-w-xl">
                <p>{msg.userMessage}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl">
                🤵‍♂️
              </div>
            </div>
            {msg.aiMessage && (
              <div className="flex justify-start items-start gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl">
                  🤖
                </div>
                <div className="bg-gray-700 px-4 py-2 rounded-xl max-w-xl">
                  <p>{msg.aiMessage}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-xl max-w-xl animate-pulse">
              <p>AI is typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="border-t border-gray-800 p-4 bg-gray-900">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            placeholder="Type or speak..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-full outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={handleMicClick}
            className={`text-white ${isListening ? "bg-red-600" : "bg-gray-700"} p-2 rounded-full`}
          >
            <Mic className="w-6 h-6" />
          </button>
          <button
            onClick={sendMessage}
            className="text-blue-500 hover:text-blue-400"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
