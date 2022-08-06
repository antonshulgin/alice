((A) => {
	'use strict';

	window.addEventListener('DOMContentLoaded', init, { once: true, passive: true });

	A.ESI_VERSION  = `latest`;
	A.ENDPOINT_ESI = `https://esi.evetech.net/${A.ESI_VERSION}`;
	A.ENDPOINT_ZKB = 'https://zkillboard.com/api';
	A.TYPE_IDS_IGNORED = [
		33328,
		33474,
		33475,
		57319,
		670,
		NaN,
		null,
		undefined,
	];

	A.humanisePlural = humanisePlural;
	A.humaniseCount  = humaniseCount;
	A.humaniseDate   = humaniseDate;
	A.jsonDecode     = jsonDecode;
	A.jsonDecodeSync = jsonDecodeSync; /* eslint no-sync: off */
	A.jsonEncode     = jsonEncode;
	A.jsonEncodeSync = jsonEncodeSync; /* eslint no-sync: off */
	A.clearState     = clearState;


	function clearState() {
		localStorage.clear();
		location.reload();
	}


	function init() {
		const dom = {
			controls: document.getElementById('Controls'),
			overview: document.getElementById('Overview'),
		};

		const ui = {
			lookup: A.Lookup({ onResolved: fetchPilots }),
		};

		clearOverview();

		dom.controls.appendChild(ui.lookup.render());

		ui.lookup.setFocus();


		function fetchPilots(pilotIds = []) {
			clearOverview();

			Promise.any(pilotIds.map((pilotId) => fetchPilot(pilotId)))
				.then(updateOverview)
				.catch(console.error)
			;
		}


		function fetchPilot(pilotId) {
			const pilot = A.Pilot(pilotId);

			dom.overview.appendChild(pilot.render());

			A.libCache.getItem(`pilotIds/${pilotId}`)
				.then(()  => { doFetch(); })
				.catch(() => {
					A.libCache.saveItem(`pilotIds/${pilotId}`, pilotId);
					doFetch();
				})
			;


			function doFetch() {
				// Fuzz it up a little bit so it resolves more randomly
				setTimeout(pilot.fetchDetails,     getRandomDelay());
				setTimeout(pilot.fetchCombatStats, getRandomDelay());
				setTimeout(pilot.fetchShipStats,   getRandomDelay());
			}
		}


		function getRandomDelay() { return Math.round((Math.random() * 7)); }


		function updateOverview(pilots) {
			dom.overview.classList.toggle('hidden', (pilots?.length <= 0));

			A.libCache.clearExpired();
		}


		function clearOverview() {
			A.libNet.resetTimedQueryCount();
			dom.overview.classList.toggle('hidden', true);
			dom.overview.replaceChildren();
		}
	}


	function jsonDecodeSync(jsonString = '') {
		let decoded;

		try { decoded = JSON.parse(jsonString); }

		catch (e) {
			console.warn('Failed to decode JSON', { jsonString });
			return {};
		}

		return decoded;
	}


	function jsonDecode(jsonString = '') {
		return new Promise((resolve, reject) => {
			let decoded;

			try { decoded = JSON.parse(jsonString); }

			catch (e) {
				console.warn('Failed to decode JSON', { jsonString });
				return reject(jsonString);
			}

			return resolve(decoded);
		});
	}


	function jsonEncodeSync(json = {}) {
			let encoded;

			try { encoded = JSON.stringify(json); }

			catch (e) {
				console.warn('Failed to encode JSON', { json });
				return '';
			}

			return encoded;
	}


	function jsonEncode(json = {}) {
		return new Promise((resolve, reject) => {
			let encoded;

			try { encoded = JSON.stringify(json); }

			catch (e) {
				console.warn('Failed to encode JSON', { json });
				return reject(json);
			}

			return resolve(encoded);
		});
	}


	function humanisePlural(value, singular, plural) {
		return (value === 1)
			? `${humaniseCount(value)} ${singular}`
			: `${humaniseCount(value)} ${plural || singular}`
		;
	}


	function humaniseCount(value = 0) {
		if (value > 1000) { return `${(value / 1000).toFixed(1)}k`; }
		return value;
	}


	function humaniseDate(date = new Date()) {
		return date?.toLocaleDateString() || '???';
	}

})((window.A = {}));
