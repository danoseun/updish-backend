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

export const initiatePayment = async (payload: InitiatePayment) => {
  try {
    const { amount, payment_plan, email, phonenumber } = payload;
    const tx_ref = crypto.randomBytes(Math.ceil(length / 2)).toString('hex');

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
    if (response.data.status === 'success') {
      return {
        status: 'success',
        message: 'Payment initiated successfully.',
        data: response.data.data
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
