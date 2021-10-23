((A) => {
	'use strict';

	const STATE = {
		timedQueryCount: 0,
	};

	const ZKB_RATE_LIMIT = 1000; // One request per second.

	A.libNet = {
		resetTimedQueryCount,
		load,
	};


	function resetTimedQueryCount() { STATE.timedQueryCount  = 0; }
	function bumpTimedQueryCount()  { STATE.timedQueryCount += 1; return getTimedQueryCount(); }
	function getTimedQueryCount()   { return STATE.timedQueryCount || 0; }


	function load(url = '', isTimed = false) {
		return new Promise((resolve, reject) => {
			if (!url) {
				console.error('No URL given');
				return reject();
			}

			A.libCache.getItem(url)
				.then((value) => resolve(value))
				.catch(()     => setTimeout(doFetch, getDelay()))
			;


			function getDelay() {
				return !!isTimed
					? (bumpTimedQueryCount() * ZKB_RATE_LIMIT)
					: 0
				;
			}


			function doFetch() {
				fetch(url)
					.then((response) => response.json())
					.then((value)    => A.libCache.saveItem(url, value))
					.then((value)    => resolve(value))
					.catch(reject)
				;
			}
		});
	}

})(window.A);
