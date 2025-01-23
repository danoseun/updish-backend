import axiosService from './axios';
import variables from '../variables';



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


interface VerifyTransactionResponse {
    status: string;
    message: string;
    data?: any;
}

export const verifyRaveTransactions = async (transactionRef: string): Promise<VerifyTransactionResponse> => {
    try {
        const response = await axiosService({
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${variables.services.flutterwave.raveSecretApi}`,
            },
            url: `${variables.services.flutterwave.raveSecetUrl}/transactions/verify_by_reference?tx_ref=${transactionRef}`,
        });

        // Assuming a successful response includes status and data
        return {
            status: 'success',
            message: 'Transaction verified successfully.',
            data: response.data,
        };
    } catch (error: any) {
        // Extracting more information from the error object
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || "Something went wrong";

        console.error("callVerifyRaveTrx error", { statusCode, errorMessage });

        if (statusCode === 404 || statusCode === 400) {
            return { status: "error", message: "Transaction not found!" };
        }

        return { status: "error", message: "Transaction either failed or was not found!" };
    }
};
