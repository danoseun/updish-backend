import axios from "axios";
axios.defaults.timeout = 60 * 1000;

type payload = {
	url: string;
	method: string;
	data?: any;
	signal?: any;
	params?: any;
	headers?: any;
	auth?: any;
};

/**
 * Helper for calling axios services
 */
const axiosService = async ({
	url,
	method,
	data,
	signal,
	params,
	headers,
	auth,
}: payload): Promise<any> => {
	return await axios({
		method,
		url,
		...(params && { params }),
		...(signal && { cancelToken: signal }),
		...(data && { data }),
		headers: headers
			? headers
			: {
					Accept: "application/json",
					"Content-Type": "application/json;charset=UTF-8",
			  },
		...(auth && { auth }),
	});
};

export default axiosService;
