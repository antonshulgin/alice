((A) => {
	'use strict';

	const TEMPLATE = document.getElementById('templatePilot');

	const MILITIA_ID = {
		CALDARI:  500001,
		MINMATAR: 500002,
		AMARR:    500003,
		GALLENTE: 500004,
	};

	const MILITIA_LABEL = {
		[MILITIA_ID.CALDARI]:  'caldari',
		[MILITIA_ID.MINMATAR]: 'minmatar',
		[MILITIA_ID.AMARR]:    'amarr',
		[MILITIA_ID.GALLENTE]: 'gallente',
	};

	A.Pilot = (pilotId) => {
		const root = document.importNode(TEMPLATE.content, true).firstChild;
		const dom  = {
			portrait:    root.querySelector('.Pilot-portrait'),
			summary:     root.querySelector('.Pilot-summary'),
			status:      root.querySelector('.Pilot-status'),
			name:        root.querySelector('.Pilot-name'),
			affiliation: root.querySelector('.Pilot-affiliation'),
			alliance:    root.querySelector('.Pilot-alliance'),
			corp:        root.querySelector('.Pilot-corp'),
			militia:     root.querySelector('.Pilot-militia'),
			combatStats: root.querySelector('.Pilot-combat-stats'),
			shipStats:   root.querySelector('.Pilot-ship-stats'),
		};

		const ui = {
			combatStats: A.CombatStats(getId()),
			shipStats:   A.ShipStats(getId()),
		};

		dom.combatStats.replaceChildren(ui.combatStats.render());
		dom.shipStats.replaceChildren(ui.shipStats.render());

		return {
			MILITIA_ID,
			MILITIA_LABEL,
			render,
			fetchDetails,
			fetchCombatStats: ui.combatStats.fetchCombatStats,
			fetchShipStats:   ui.shipStats.fetchShipStats,
			getId,
		};


		function render() { return root; }


		function fetchDetails() {
			Promise.all([
				fetchInfo(),
				fetchPortrait(),
			])
				.then(([ info ]) => fetchAffiliation(info))
			;
		}


		function getId() { return pilotId; }


		function fetchInfo() {
			return new Promise((resolve, reject) => {
				[
					dom.portrait,
					dom.status,
					dom.name,
					dom.alliance,
					dom.corp,
					dom.militia,
				]
					.forEach((node) => node.classList.toggle('busy', true))
				;

				A.libNet.load(`${A.ENDPOINT_ESI}/characters/${getId()}`)
					.then(doResolve)
					.catch(doReject)
				;


				function doResolve(info) {
					setName(info.name);
					setStatus(info.security_status);

					return resolve(info);
				}


				function doReject(event) {
					dom.portrait.classList.toggle('busy', false);
					return reject(event);
				}
			});
		}


		function setName(name) {
			dom.summary.href     = `https://zkillboard.com/character/${getId()}`;
			dom.name.textContent = name;
			dom.name.classList.toggle('busy', false);
		}


		function setStatus(status = 0) {
			dom.status.dataset.status = Math.round(status) || 0;
			dom.status.classList.toggle('busy', false);
		}


		function fetchPortrait() {
			return new Promise((resolve, reject) => {
				dom.portrait.classList.toggle('busy', true);

				A.libNet.load(`${A.ENDPOINT_ESI}/characters/${getId()}/portrait`)
					.then(doResolve)
					.catch(doReject)
				;


				function doResolve(portrait) {
					setPortrait(portrait);
					return resolve(portrait);
				}


				function doReject(event) {
					dom.portrait.classList.toggle('busy', false);
					return reject(event);
				}
			});
		}


		function setPortrait(portrait = {}) {
			dom.portrait.src = portrait.px64x64 || '';
			dom.portrait.classList.toggle('busy', false);
		}


		function fetchAffiliation(info) {
			return Promise.all([
				fetchCorp(info.corporation_id),
				fetchAlliance(info.alliance_id),
			]);
		}


		function fetchCorp(corpId) {
			return new Promise((resolve, reject) => {
				if (!corpId) {
					setCorp(undefined);
					return resolve(undefined);
				}

				A.libNet.load(`${A.ENDPOINT_ESI}/corporations/${corpId}`)
					.then(doResolve)
					.catch(reject)
				;

				function doResolve(corp) {
					setCorp(corp);
					setMilitia(corp.faction_id);
					return resolve(corp);
				}
			});
		}


		function setCorp(corp) {
			dom.corp.textContent = corp?.ticker || 'N/A';
			dom.corp.title       = corp?.name   || 'N/A';
			dom.corp.classList.toggle('busy', false);
			dom.corp.classList.toggle('hidden', !corp);
			dom.affiliation.classList.toggle('busy', false);
		}


		function setMilitia(factionId) {
			dom.militia.textContent = humaniseMilitia(factionId);
			dom.militia.classList.toggle('busy', false);
			dom.militia.classList.toggle('hidden', !factionId);
			dom.affiliation.dataset.militia = MILITIA_LABEL[factionId] || 'neutral';
			dom.affiliation.classList.toggle('busy', false);
		}


		function humaniseMilitia(factionId) {
			switch (factionId) {
				case (MILITIA_ID.CALDARI):  { return 'Caldari militia'; }
				case (MILITIA_ID.MINMATAR): { return 'Minmatar militia'; }
				case (MILITIA_ID.AMARR):    { return 'Amarr militia'; }
				case (MILITIA_ID.GALLENTE): { return 'Gallente militia'; }
				default:                    { return 'Neutral'; }
			}
		}


		function fetchAlliance(allianceId) {
			return new Promise((resolve, reject) => {
				if (!allianceId) {
					setAlliance(undefined);
					return resolve(undefined);
				}

				A.libNet.load(`${A.ENDPOINT_ESI}/alliances/${allianceId}`)
					.then(doResolve)
					.catch(reject)
				;


				function doResolve(alliance) {
					setAlliance(alliance);
					return resolve(alliance);
				}
			});
		}


		function setAlliance(alliance) {
			dom.alliance.textContent = alliance?.ticker || 'N/A';
			dom.alliance.title       = alliance?.name   || "N/A";
			dom.alliance.classList.toggle('busy', false);
			dom.alliance.classList.toggle('hidden', !alliance);
			dom.affiliation.classList.toggle('busy', false);
		}

	};

})(window.A);
