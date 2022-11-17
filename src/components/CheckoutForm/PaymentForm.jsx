import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { Typography, Divider, FormControlLabel, FormControl, Radio, RadioGroup, Box } from '@material-ui/core';
import { Elements, CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CoinbaseCommerceButton from 'react-coinbase-commerce';
import 'react-coinbase-commerce/dist/coinbase-commerce-button.css';
import Review from './Review';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ checkoutToken, nextStep, backStep, shippingData, onCaptureCheckout }) => {
  const [payType, setPayType] = useState(1);
  const customMetadata = [{
    pricing_type: 'fixed_price',
    local_price: {
      amount: '100',
      currency: 'USD',
    },
  }];
  const handleSubmit = async (event, elements, stripe) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });

    if (error) {
      console.log('[error]', error);
    } else {
      const orderData = {
        line_items: checkoutToken.live.line_items,
        customer: { firstname: shippingData.firstName, lastname: shippingData.lastName, email: shippingData.email },
        shipping: { name: 'International', street: shippingData.address1, town_city: shippingData.city, county_state: shippingData.shippingSubdivision, postal_zip_code: shippingData.zip, country: shippingData.shippingCountry },
        fulfillment: { shipping_method: shippingData.shippingOption },
        payment: {
          gateway: 'stripe',
          stripe: {
            payment_method_id: paymentMethod.id,
          },
        },
      };
      onCaptureCheckout(checkoutToken.id, orderData);
      nextStep();
    }
  }

  return (
    <>
      <Review checkoutToken={checkoutToken} />
      <Divider />
      <Typography variant="h6" gutterBottom style={{ margin: '20px 0' }}>Payment method</Typography>

      <FormControl component="fieldset" mb={2} pb={2}>
        <RadioGroup row aria-label="position" name="position" value={payType} defaultValue={1} onChange={(e) => { setPayType(Number(e.target.value)); }}>
          <FormControlLabel
            value={1}
            control={<Radio color="primary" />}
            labelPlacement="End"
            label="Credit Card"
          />

          <FormControlLabel
            value={2}
            control={<Radio color="primary" />}
            labelPlacement="End"
            label="Bitcoin"
          />

        </RadioGroup>
      </FormControl>

      <>
        { payType === 2
          ? (
            <div>
              <Box display="flex" justifyContent="center" m={1} p={1} bgcolor="background.paper">
                <div>
                  {checkoutToken.live.total.formatted_with_symbol}
                </div>
              </Box>
              <Box display="flex" justifyContent="center" m={1} p={1} bgcolor="background.paper">
                <CoinbaseCommerceButton checkoutId="86827167-ed99-4ee6-93fb-30222f2fea66" styled="true" customMetadata={customMetadata} />
              </Box>
            </div>
          )
          : (
            <>
              <Elements stripe={stripePromise}>
                <ElementsConsumer>{({ elements, stripe }) => (
                  <form onSubmit={(e) => handleSubmit(e, elements, stripe)}>
                    <CardElement />
                    <br /> <br />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button variant="outlined" onClick={backStep}>Back</Button>
                      <Button type="submit" variant="contained" disabled={!stripe} color="primary">
                        Pay {checkoutToken.live.subtotal.formatted_with_symbol}
                      </Button>
                    </div>
                  </form>
                )}
                </ElementsConsumer>
              </Elements>
            </>
          )}
      </>
    </>
  );
};

export default PaymentForm;
