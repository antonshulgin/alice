((A) => {
	'use strict';

	const STORAGE      = {};             // TODO: Use IndexedDB instead of storing shit in memory
	const EXPIRY_LIMIT = 1000 * 60 * 30; // 30 minutes

	A.libCache = {
		clearExpired,
		getItem,
		saveItem,
	};


	function clearExpired() {
		return new Promise((resolve, reject) => {

			Object.values(STORAGE).forEach((itemRaw) => {
				decodeJson(itemRaw)
					.then((item) => { if (isExpired(item)) { removeItem(item.key); } })
					.catch(reject)
				;
			});

			return resolve();
		});
	}


	function saveItem(key, value = {}) {
		return new Promise((resolve, reject) => {
			const item = {
				key,
				value,
				lastCached: Date.now(),
			};

			encodeJson(item)
				.then(doResolve)
				.catch(reject)
			;


			function doResolve(encoded) {
				STORAGE[key] = encoded;
				return resolve(item.value);
			}
		});
	}


	function removeItem(key) {
		return new Promise((resolve) => {
			delete STORAGE[key];
			return resolve();
		});
	}


	function getItem(key) {
		return new Promise((resolve, reject) => {
			decodeJson(STORAGE[key])
				.then(doResolve)
				.catch(reject)
			;


			function doResolve(item = {}) {
				return isExpired(item)
					? reject()
					: resolve(item.value)
				;
			}
		});
	}


	function isExpired(item = {}) {
		if (!item?.lastCached) { return true; }

		const timeDiff = Math.abs(Date.now() - item.lastCached);

		return (timeDiff >= EXPIRY_LIMIT);
	}


	function decodeJson(jsonString = '') {
		return new Promise((resolve, reject) => {
			let decoded;

			try {
				decoded = JSON.parse(jsonString);
			}

			catch (e) {
				console.warn('Failed to decode JSON', { jsonString });
				return reject(jsonString);
			}

			return resolve(decoded);
		});
	}


	function encodeJson(json = {}) {
		return new Promise((resolve, reject) => {
			let encoded;

			try {
				encoded = JSON.stringify(json);
			}

			catch (e) {
				console.warn('Failed to encode JSON', { json });
				return reject(json);
			}

			return resolve(encoded);
		});
	}

})(window.A);
