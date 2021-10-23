((A) => {
	'use strict';

	const TEMPLATE = document.getElementById('templateShipStats');

	A.ShipStats = (pilotId) => {
		const root = document.importNode(TEMPLATE.content, true).firstChild;
		const dom  = {
			doFetch: root.querySelector('.ShipStats-fetch-stats'),
			ships:   root.querySelector('.ShipStats-ships'),
		};

		dom.doFetch.addEventListener('click', () => fetchShipStats(false), { passive: true });

		return {
			render,
			fetchShipStats,
		};


		function render() { return root; }


		function fetchShipStats(isTimed = true) {
			return new Promise((resolve, reject) => {
				if (!getId()) { return resolve(undefined); }

				markBusy();

				Promise.resolve()
					.then(()          => fetchRecentFights(isTimed))
					.then((zkbStubs)  => fetchKillmails(zkbStubs))
					.then((killmails) => parseKillmails(killmails))
					.then((stats)     => mixinShips(stats))
					.then((stats)     => mixinRatios(stats))
					.then((stats)     => doResolve(stats))
					.catch(doReject)
				;


				function doResolve(stats) {
					setShipStats(stats);
					return resolve(stats);
				}


				function doReject(event) {
					dom.doFetch.textContent = 'Could not';

					setTimeout(markIdle, 1000);

					return reject(event);
				}
			});
		}


		function mixinRatios(stats = []) {
			return new Promise((resolve) => {
				const topCount = stats.reduce((out, statsItem) => {
					return (statsItem.total > out) ? statsItem.total : out;
				}, 0);

				stats.forEach((statsItem) => {
					statsItem.ratio = statsItem.total / (topCount || 1);
				});

				return resolve(stats);
			});
		}


		function mixinShips(stats = []) {
			return new Promise((resolve, reject) => {
				Promise.all(stats.map(mixinShipInfo))
					.then(doResolve)
					.catch(reject)
				;


				function doResolve(statsWithInfo) {
					return resolve(statsWithInfo);
				}
			});
		}


		function mixinShipInfo(statsItem = {}) {
			return new Promise((resolve, reject) => {
				A.libNet.load(`${A.ENDPOINT_ESI}/universe/types/${statsItem.id}`)
					.then(doResolve)
					.catch(reject)
				;


				function doResolve(shipInfo) {
					statsItem.info = shipInfo;
					return resolve(statsItem);
				}
			});
		}


		function setShipStats(stats = []) {
			const shipStatsTiles = stats.map(A.ShipStatsTile);

			dom.ships.replaceChildren(...shipStatsTiles.map((tile) => tile.render()));

			root.classList.toggle('ready', true);

			markIdle();
		}


		function getId() { return pilotId; }


		function parseKillmails(killmails = []) {
			return new Promise((resolve) => {
				const stats = killmails
					.reduce((out, km) => out.concat(findShipMatches(km, getId())), [])
					.sort((a, b) => (b.date - a.date))
				;

				const statsMerged = mergeStats(stats);

				return resolve(statsMerged);
			});
		}


		function findShipMatches(killmail, pilotId) {
			const matches = [].concat(
				findVictim(killmail, pilotId),
				findAttackers(killmail, pilotId),
			)
				.flat(1)
				.filter((match) => !!match)
			;

			return matches;
		}


		function findAttackers(km, pilotId) {
			const matches = km.attackers.reduce((out, a) => {
				const characterId = parseInt(a.character_id);
				const shipTypeId  = parseInt(a.ship_type_id);

				if (isNaN(characterId) || isNaN(shipTypeId)) { return out; }
				if (A.TYPE_IDS_IGNORED.includes(shipTypeId)) { return out; }
				if (characterId !== pilotId)                 { return out; }

				return out.concat({
					characterId: characterId,
					date:        new Date(km.killmail_time),
					id:          shipTypeId,
					info:        {},
					isKill:      true,
				});
			}, []);

			return matches;
		}


		function findVictim(km, pilotId) {
			const characterId = parseInt(km.victim.character_id);
			const shipTypeId  = parseInt(km.victim.ship_type_id);

			if (isNaN(characterId) || isNaN(shipTypeId)) { return; }
			if (A.TYPE_IDS_IGNORED.includes(shipTypeId)) { return; }
			if (characterId !== pilotId)                 { return; }

			return {
				characterId: characterId,
				date:        new Date(km.killmail_time),
				id:          shipTypeId,
				info:        {},
				isKill:      false,
			};
		}


		function mergeStats(ships = []) {
			const grouped = ships.reduce((out, ship) => {
				if (!out[ship.id]) {
					out[ship.id] = {
						id:     ship.id,
						fights: [],
						losses: 0,
						kills:  0,
						total:  0,
						dates:  []
					};
				}

				out[ship.id] = mergeShipStats(ship, out[ship.id]);

				return out;
			}, {});

			Object.values(grouped).forEach((shipGroup) => {
				shipGroup.dateLastSeen = shipGroup.dates.sort((a, b) => (b - a))[0];
			});

			const sorted = Object.values(grouped)
				.sort((a, b) => (b.dateLastSeen - a.dateLastSeen))
				.slice(0, 3)
			;

			return sorted;
		}


		function mergeShipStats(fight, shipGroup) {
			shipGroup.total  += 1;
			shipGroup.losses += (fight.isKill ? 0 : 1);
			shipGroup.kills  += (fight.isKill ? 1 : 0);

			shipGroup.fights.push(fight);
			shipGroup.dates.push(fight.date);
			shipGroup.dates.sort((a, b) => (b - a));

			return shipGroup;
		}


		function fetchRecentFights(isTimed = true) {
			return A.libNet.load(`${A.ENDPOINT_ZKB}/characterID/${getId()}/`, !!isTimed);
		}


		function fetchKillmails(zkbStubs = []) {
			return Promise.all(zkbStubs.slice(0, 7).map(fetchKillmail));
		}


		function fetchKillmail(zkbStub = {}) {
			return A.libNet.load(`${A.ENDPOINT_ESI}/killmails/${zkbStub.killmail_id}/${zkbStub.zkb.hash}`);
		}


		function markBusy() {
			dom.doFetch.textContent = 'Getting ship stats';
			dom.doFetch.classList.toggle('busy', true);
		}


		function markIdle() {
			dom.doFetch.textContent = 'Get ship stats';
			dom.doFetch.classList.toggle('busy', false);
		}
	};

})(window.A);
