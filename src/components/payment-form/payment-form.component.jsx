import { useState } from "react";
import { useSelector } from "react-redux";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { selectCartTotal } from "../../store/cart/cart.selector";
import { selectCurrentUser } from "../../store/user/user.selector"; 

import { BUTTON_TYPE_CLASSES } from "../button/button.component";

import { PaymentFormContainer, FormContainer, PaymentButton } from "./payment-form.styles";

const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const amount = useSelector(selectCartTotal);
    const currentUser = useSelector(selectCurrentUser);
    const [ isProcessingPayment, setIsProcessingPayment ] = useState(false);
    
    const paymentHandler = async (e) => {
        e.preventDefault();
        
        if ( !stripe || !elements ) {
            return;
        }
        
        setIsProcessingPayment(true);

        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ amount: amount * 100 }) // stripe expect cents value
        }).then( res => res.json());
        
        console.log(response);

        const {
            paymentIntent: { client_secret },
        } = response

        const paymentResult = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                    name: currentUser ? currentUser.displayName : 'Guest'
                }
            }
        });
        
        setIsProcessingPayment(false);
        console.log("Payment result", paymentResult);

        if (paymentResult.error) {
            alert(paymentResult.error);
        } else {
            if (paymentResult.paymentIntent.status === 'succeeded') {
                alert("Payment successful!");
            }
        }
    }

    return (
        <PaymentFormContainer>
            <FormContainer onSubmit={ paymentHandler }>
                <h2>Credit Card Payment: </h2>
                <CardElement />
                <PaymentButton isLoading={ isProcessingPayment } buttonType={ BUTTON_TYPE_CLASSES.inverted }>
                    Pay Now
                </PaymentButton>
            </FormContainer>
        </PaymentFormContainer>
    )
}

export default PaymentForm;