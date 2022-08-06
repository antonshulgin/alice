((A) => {
	'use strict';

	// https://docs.esi.evetech.net/docs/sso/native_sso_flow.html

	window.addEventListener('DOMContentLoaded', dispatchAuthState, { once: true, passive: true });

	const ENDPOINT_OAUTH   = `https://login.eveonline.com/v2/oauth`;
	const ENDPONT_SSO_META = `https://login.eveonline.com/.well-known/oauth-authorization-server`;

	const CLIENT_ID      = `7eae96ab6dc3483b850bfec0fa3673f4`;
	const ESI_SCOPES     = [
		`esi-search.search_structures.v1`,
	].join(` `);

	A.libAuth = {
		authorize,
		base64UrlDecode,
		base64UrlEncode,
		dispatchAuthState,
		getAccessToken,
		getOauthState,
		getParamAuthCode,
		getPilotId,
		prepareCodeChallenge,
		toSha256,
	};


	function dispatchAuthState() {
		const authCode           = getParamAuthCode();
		const oauthStateReturned = getParamOauthStateReturned();
		const accessToken        = getAccessToken();

		if (
			!accessToken &&
			!authCode    &&
			!oauthStateReturned
		) {
			return authorize();
		}

		if (!authCode)           { return; }
		if (!oauthStateReturned) { return; }

		return (oauthStateReturned === getOauthState())
			? fetchAccessToken(authCode)
			: authorize()
		;
	}


	function authorize() {
		const url = new URL(`${ENDPOINT_OAUTH}/authorize`);

		prepareCodeChallenge()
			.then(doAuthorize)
			.catch(console.error)
		;


		function doAuthorize(codeChallenge) {
			url.searchParams.set(`response_type`,         `code`);
			url.searchParams.set(`redirect_uri`,          `${location.origin}${location.pathname}`);
			url.searchParams.set(`client_id`,             `${CLIENT_ID}`);
			url.searchParams.set(`scope`,                 `${ESI_SCOPES}`);
			url.searchParams.set(`state`,                 `${generateOauthState()}`);
			url.searchParams.set(`code_challenge_method`, `S256`);
			url.searchParams.set(`code_challenge`,        `${codeChallenge}`);

			location.assign(url);
		}
	}


	function fetchAccessToken(authCode) {
		const formData     = new FormData();
		const codeVerifier = getCodeVerifier();

		formData.set(`client_id`,     `${CLIENT_ID}`);
		formData.set(`grant_type`,    `authorization_code`);
		formData.set(`code`,          `${authCode}`);
		formData.set(`code_verifier`, `${codeVerifier}`);

		const formDataUrlEncoded = (new URLSearchParams(formData)).toString();

		const headers = new Headers();
		headers.set(`Content-Type`, `application/x-www-form-urlencoded`);
		headers.set(`Host`,         `login.eveonline.com`);

		const url = new URL(`${ENDPOINT_OAUTH}/token`);

		fetch(url, {
			method:  'POST',
			body:    formDataUrlEncoded,
			headers: headers,
		})
			.then((response)  => response.json())
			.then((response)  => validateAccessToken(response))
			.catch((response) => console.error(`fetchAccessToken reject`, { response }))
		;
	}


	function validateAccessToken(response) {
		const accessToken       = response.access_token;
		const accessTokenParsed = parseAccessToken(accessToken);

		console.log('validateAccessToken doValidate', { response, accessToken, accessTokenParsed });

		fetch(ENDPONT_SSO_META)
			.then((response)  => response.json())
			.then((response)  => doValidate(response))
			.catch((response) => console.error(`validateAccessToken reject`, { response }))
		;


		// TODO: Actually validate the thing
		// https://docs.esi.evetech.net/docs/sso/validating_eve_jwt.html

		function doValidate(metadata) {
			console.log('validateAccessToken doValidate', { metadata, accessTokenParsed });

			setPilotId(parsePilotId(accessTokenParsed));
			setAccessToken(accessToken);

			location.assign(`${location.origin}${location.pathname}`);
		}
	}


	function getPilotId() { return localStorage.getItem('pilotId'); }


	function setPilotId(pilotId) {
		localStorage.setItem('pilotId', pilotId);
	}


	function parsePilotId(accessTokenParsed) {
		const pilotId = accessTokenParsed?.payload?.sub?.split(':').pop();
		return pilotId;
	}


	function parseAccessToken(jwt) {
		console.log('parseJwt', { jwt });

		const [ header, payload, signature ] = jwt.split('.');

		return {
			header:    A.jsonDecodeSync(base64UrlDecode(header)),  /* eslint no-sync: off */
			payload:   A.jsonDecodeSync(base64UrlDecode(payload)), /* eslint no-sync: off */
			signature: signature,
		};
	}


	function setAccessToken(accessToken) {
		localStorage.setItem('accessToken', accessToken);
	}


	function getAccessToken()  { return localStorage.getItem(`accessToken`); }
	function getOauthState()   { return localStorage.getItem(`oauthState`); }
	function getCodeVerifier() { return localStorage.getItem('codeVerifier'); }


	function generateOauthState() {
		const state = toByteString(generateRandomBytes(4));

		localStorage.setItem(`oauthState`, state);

		return getOauthState();
	}


	function prepareCodeChallenge() {
		return new Promise((resolve, reject) => {
			const codeVerifier = base64UrlEncode(generateRandomBytes(32));

			localStorage.setItem('codeVerifier', codeVerifier);

			toSha256(codeVerifier)
				.then((codeChallenge) => resolve(base64UrlEncode(codeChallenge)))
				.catch(reject)
			;
		});
	}


	function toSha256(string = '') {
		return new Promise((resolve, reject) => {
			const bytes = (new TextEncoder()).encode(string);

			crypto.subtle.digest(`SHA-256`, bytes)
				.then((sha256ArrayBuffer) => resolve([...new Uint8Array(sha256ArrayBuffer)]))
				.catch(reject)
			;
		});
	}


	function base64UrlEncode(bytes = new Uint8Array()) {
		const string = [...bytes]
			.map((byte) => String.fromCharCode(byte))
			.join('')
		;

		const REGEX_EQUALS = [  /=/g,  '' ]; /* eslint no-div-regex: off */
		const REGEX_PLUS   = [ /\+/g, '-' ];
		const REGEX_SLASH  = [ /\//g, '_' ];

		const encoded = btoa(string)
			.replace(...REGEX_EQUALS)
			.replace(...REGEX_PLUS)
			.replace(...REGEX_SLASH)
		;

		return encoded;
	}


	function base64UrlDecode(string) {
		const REGEX_MINUS      = [ /-/g, '+' ];
		const REGEX_UNDERSCORE = [ /_/g, '/' ];

		const base64 = string
			.replace(...REGEX_MINUS)
			.replace(...REGEX_UNDERSCORE)
		;

		const decoded = atob(base64);

		return decoded;
	}


	function toByteString(bytes = []) {
		const byteString = [...bytes]
			.map((b) => b.toString(16).padStart(2, 0))
			.join('')
		;

		return byteString;
	}


	function generateRandomBytes(length = 8) {
		const bytes = (new Uint8Array(length))
			.fill()
			.map(() => Math.round(Math.random() * 0xff))
		;

		return bytes;
	}


	function getParamOauthStateReturned() {
		return (new URL(location).searchParams.get('state'));
	}


	function getParamAuthCode() {
		return (new URL(location)).searchParams.get('code');
	}

})(window.A);

