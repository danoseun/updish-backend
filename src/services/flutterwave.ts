import axiosService from './axios';
import variables from '../variables';
import crypto from 'crypto';

// export const callVerifyRaveTrx: any(trxRef: string) => {
//     try {
//         return await axiosService({
//             method: "GET",
//             headers: {
//                 "content-type": "application/json",
//                 Authorization: `Bearer ${RAVE_SECRET_API}`,
//             },
//             url: `${RAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${trxRef}`,
//         });
//     } catch (ex: any) {
//         // if (ex.response?.status == 404 || ex.response?.status == 400) {
//         // 	throw new NotFoundError("Transaction not found!!");
//         // }
//         // throw new InternalServerError("Something went wrong");

//         // console.log("callVerifyRaveTrx", { ex })
//         console.log("callVerifyRaveTrx ex", { ex: ex.response.data })

//         return { status: "error", message: "Transaction either failed or was not found!!" }
//     }
// }

// interface VerifyTransactionResponse {
//     status: string;
//     message: string;
//     data?: any;
// }

// export const verifyRaveTransactions = async (transactionRef: string): Promise<VerifyTransactionResponse> => {
//     try {
//         const response = await axiosService({
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`,
//             },
//             url: `${variables.services.flutterwave.raveBaseUrl}/transactions/verify_by_reference?tx_ref=${transactionRef}`,
//         });

//         // Assuming a successful response includes status and data
// return {
//     status: 'success',
//     message: 'Transaction verified successfully.',
//     data: response.data,
// };
//     } catch (error: any) {
//         // Extracting more information from the error object
//         const statusCode = error.response?.status || 500;
//         const errorMessage = error.response?.data?.message || "Something went wrong";

//         console.error("callVerifyRaveTrx error", { statusCode, errorMessage });

//         if (statusCode === 404 || statusCode === 400) {
//             return { status: "error", message: "Transaction not found!" };
//         }

//         return { status: "error", message: "Transaction either failed or was not found!" };
//     }
// };

interface InitiatePayment {
  tx_ref: string;
  amount: string;
  currency: string;
  payment_plan: string;
  redirect_url: string;
  order_code: string;
  email: string;
  name?: string;
  phonenumber?: string;
}

export const createPaymentPlan = async (amount: number, plan_name: string, interval: string) => {
  try {
    const response = await axiosService({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`
      },
      url: `${variables.services.flutterwave.raveBaseUrl}/v3/payment-plans`,
      data: {
        amount,
        name: plan_name,
        interval
      }
    });

    if (response.data.status === 'success') {
      return {
        status: 'success',
        message: 'Plan created successfully.',
        data: response.data.data
      };
    } else {
      console.log({ response: response.data });
      throw new Error('Failed to create payment plan');
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message || error
    };
  }
};

export const initiatePayment = async (payload: Partial<InitiatePayment>) => {
  try {
    const { amount, payment_plan, email, phonenumber, order_code } = payload;
    const tx_ref = `TXREF_${order_code}_${Date.now().toString()}`;

    console.log({ tx_ref });

    const response = await axiosService({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`
      },
      url: `${variables.services.flutterwave.raveBaseUrl}/v3/payments`,
      data: {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: 'https://example_company.com/success',
        payment_plan,
        customer: {
          email,
          phonenumber
        }
      }
    });
    console.log('FROM INITIATE PAYMENT', { response });
    if (response.data.status === 'success') {
      return {
        status: 'success',
        message: 'Payment initiated successfully.',
        data: response.data.data,
        transaction_ref: tx_ref
      };
    } else {
      console.log({ response: response.data });
      throw new Error('Failed to initiate payment');
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message || error
    };
  }
};

export const verifyPayment = async (id: number) => {
  try {
    const response = await axiosService({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`
      },
      url: `${variables.services.flutterwave.raveBaseUrl}/v3/transactions/${id}/verify`
    });
    console.log({ response });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.message || error
    };
  }
};

export const cancelPaymentPlan = async (id: string) => {
  try {
    const response = await axiosService({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`
      },
      url: `${variables.services.flutterwave.raveBaseUrl}/v3/payment-plans/${id}/cancel`
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.message || error
    };
  }
};

export const generateVirtualAccount = async (payload: { email: string; amount: number; order_code: string }) => {
  try {
    const { email, amount, order_code } = payload;

    const tx_ref = `TXREF_${order_code}_${Date.now().toString()}`;

    const response = await axiosService({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`
      },
      url: `${variables.services.flutterwave.raveBaseUrl}/v3/virtual-account-numbers`,
      data: {
        email,
        amount,
        tx_ref,
        is_permanent: false,
        narration: 'Updish'
      }
    });
    console.log('GENERATE VIRTUAL ACCOUNT', { response });
    if (response.data.status === 'success') {
      return {
        status: 'success',
        message: 'Virtual account created successfully.',
        data: response.data.data,
        transaction_ref: tx_ref
      };
    } else {
      throw new Error('Failed to generate virtual account');
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message || error
    };
  }
};

// VERIFY_PAYMENT_RESPONSE
// {
//   id: 8355383,
//   tx_ref: 'TXREF_859900_1738229031757',
//   flw_ref: 'FLW-MOCK-4a57e79b94218693a05cd1d1951055a9',
//   device_fingerprint: '43e667eed6cbf0b1f62c89f0d7baeb6a',
//   amount: 5700,
//   currency: 'NGN',
//   charged_amount: 5700,
//   app_fee: 79.8,
//   merchant_fee: 0,
//   processor_response: 'Approved. Successful',
//   auth_model: 'VBVSECURECODE',
//   ip: '52.209.154.143',
//   narration: 'CARD Transaction ',
//   status: 'successful',
//   payment_type: 'card',
//   created_at: '2025-01-30T09:24:34.000Z',
//   account_id: 2581975,
//   card: {
//     first_6digits: '553188',
//     last_4digits: '2950',
//     issuer: ' CREDIT',
//     country: 'NIGERIA NG',
//     type: 'MASTERCARD',
//     token: 'flw-t1nf-f68b39a0e63bde33c9c0731f47d0244b-m03k',
//     expiry: '09/32'
//   },
//   meta: {
//     __CheckoutInitAddress: 'https://checkout-v2.dev-flutterwave.com/v3/hosted/pay'
//   },
//   plan: 72117,
//   amount_settled: 5614.21,
//   customer: {
//     id: 2578819,
//     name: 'Anonymous customer',
//     phone_number: '08155846990',
//     email: 'timiajibade24@gmail.com',
//     created_at: '2025-01-29T12:51:31.000Z'
//   }
// }
