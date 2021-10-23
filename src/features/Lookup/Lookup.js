((A) => {
	'use strict';

	const TEMPLATE = document.getElementById('templateLookup');

	A.Lookup = (params = {}) => {
		const root = document.importNode(TEMPLATE.content, true).firstChild;

		root.addEventListener('submit', doSubmit);
		root.names.addEventListener('focus', setFocus);

		return {
			setFocus,
			render,
			parseNames,
		};

		function render()   { return root; }
		function setFocus() { root.names.select(); }


		function doSubmit(event) {
			event.preventDefault();

			markBusy();

			Promise.resolve(root.names.value)
				.then((namesRaw) => parseNames(namesRaw))
				.then((names)    => fetchPilotIds(names))
				.then((pilotIds) => doResolve(pilotIds))
				.catch(doReject)
			;
		}


		function parseNames(namesRaw = '') {
			return new Promise((resolve) => {
				const names = [ ...new Set(namesRaw
					.split(/\n+/)
					.map((n)    => n.trim().toLowerCase())
					.filter((n) => (n.length > 0))
				)];

				return resolve(names);
			});
		}


		function fetchPilotIds(names = []) {
			return new Promise((resolve, reject) => {
				Promise.all(names.map(fetchPilotId))
					.then((pilotIds) => resolve(pilotIds.flat(1)))
					.catch(reject)
				;
			});
		}


		function fetchPilotId(name = '') {
			return new Promise((resolve, reject) => {

				A.libNet.load(`${A.ENDPOINT_ESI}/search/?search=${encodeURIComponent(name)}&categories=character&strict=true`)
					.then(doResolve)
					.catch(reject)
				;


				function doResolve(json) {
					// Array, can be more than one id with the same name.
					const pilotIds = json?.character || [];
					return resolve(pilotIds);
				}
			});
		}


		function doResolve(pilotIds) {
			markReady();

			return params?.onResolved(pilotIds);
		}


		function doReject(event) {
			console.error(event);

			root.doLookup.textContent = 'Could not';
			root.doLookup.classList.toggle('busy', true);

			setTimeout(markIdle, 1000);
		}


		function markBusy() {
			root.doLookup.textContent = 'Working';
			root.doLookup.classList.toggle('busy', true);
		}


		function markReady() {
			root.doLookup.textContent = 'Ready';
			root.doLookup.classList.toggle('busy', true);

			setTimeout(markIdle, 1000);
		}


		function markIdle() {
			root.doLookup.textContent = 'Look up';
			root.doLookup.classList.toggle('busy', false);
		}
	};

})(window.A);
