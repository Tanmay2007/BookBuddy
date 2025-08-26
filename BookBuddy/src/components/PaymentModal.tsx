import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: Id<"books">;
  bookTitle?: string;
  bookPrice?: number;
  type: "book_purchase" | "premium_subscription";
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentModal({ isOpen, onClose, bookId, bookTitle, bookPrice, type }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const createOrder = useAction(api.payments.createRazorpayOrder);
  const verifyPayment = useAction(api.payments.verifyPayment);
  const premiumFeatures = useAction(api.payments.getPremiumFeatures);
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    if (type === "premium_subscription" && isOpen) {
      premiumFeatures().then(setFeatures).catch(console.error);
    }
  }, [type, isOpen, premiumFeatures]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      let amount: number;
      
      if (type === "book_purchase" && bookPrice) {
        amount = Math.round(bookPrice * 100); // Convert to paise
      } else if (type === "premium_subscription") {
        amount = features?.monthlyPrice || 29900; // Default ₹299
      } else {
        throw new Error("Invalid payment configuration");
      }

      // Create Razorpay order
      const orderData = await createOrder({
        amount,
        bookId,
        type,
      });

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize Razorpay payment
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BookBuddy",
        description: type === "book_purchase" 
          ? `Purchase: ${bookTitle}` 
          : "Premium Subscription",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verification = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookId,
              type,
            });
            
            toast.success(verification.message);
            onClose();
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: "BookBuddy User",
          email: "user@bookbuddy.com",
        },
        theme: {
          color: "#7C3AED",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {type === "book_purchase" ? "Purchase Book" : "Premium Subscription"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {type === "book_purchase" ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">{bookTitle}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Price:</span>
                <span className="text-2xl font-bold text-green-600">₹{bookPrice}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">What you get:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Instant digital access</li>
                <li>• Read on any device</li>
                <li>• Lifetime access</li>
                <li>• Support the author</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{features ? (features.monthlyPrice / 100).toFixed(0) : '299'}/month
              </div>
              <p className="text-gray-600">Unlock premium features</p>
            </div>

            {features && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-3">Premium Features:</h5>
                <ul className="text-sm text-purple-800 space-y-2">
                  {features.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Processing..." : `Pay ₹${
              type === "book_purchase" 
                ? bookPrice 
                : features ? (features.monthlyPrice / 100).toFixed(0) : '299'
            }`}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}
