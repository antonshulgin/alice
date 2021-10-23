((A) => {
	'use strict';

	const TEMPLATE = document.getElementById('templateCombatStats');

	A.CombatStats = (pilotId) => {
		const root = document.importNode(TEMPLATE.content, true).firstChild;
		const dom  = {
			doFetch: root.querySelector('.CombatStats-fetch-stats'),
			solo:    root.querySelector('.CombatStats-solo'),
			gangs:   root.querySelector('.CombatStats-gangs'),
			losses:  root.querySelector('.CombatStats-losses'),
		};

		dom.doFetch.addEventListener('click', () => fetchCombatStats(false), { passive: true });

		markIdle();

		return {
			render,
			fetchCombatStats,
		};


		function render() { return root; }
		function getId()  { return pilotId; }


		function markBusy() {
			dom.doFetch.textContent = 'Getting combat stats';
			dom.doFetch.classList.toggle('busy', true);
		}


		function markIdle() {
			dom.doFetch.textContent = 'Get combat stats';
			dom.doFetch.classList.toggle('busy', false);
		}


		function fetchCombatStats(isTimed = true) {
			return new Promise((resolve, reject) => {
				if (!getId()) { return resolve(undefined); }

				markBusy();

				A.libNet.load(`${A.ENDPOINT_ZKB}/stats/characterID/${getId()}/`, !!isTimed)
					.then(doResolve)
					.catch(doReject)
				;


				function doResolve(zkbStats) {
					setCombatStats(zkbStats);
					return resolve(zkbStats);
				}


				function doReject(event) {
					dom.doFetch.textContent = 'Could not';

					setTimeout(() => {
						root.classList.toggle('ready', false);
						markIdle();
					}, 1000);

					return reject(event);
				}
			});
		}


		function setCombatStats(zkbStats = {}) {
			const losses     = zkbStats?.shipsLost      || 0;
			const killsTotal = zkbStats?.shipsDestroyed || 0;
			const killsSolo  = zkbStats?.soloKills      || 0;
			const killsGangs = killsTotal - killsSolo;

			const total       = (killsTotal + losses) || 1;
			const ratioLosses = losses     / total;
			const ratioGangs  = killsGangs / (killsTotal || 1);
			const ratioSolo   = killsSolo  / (killsTotal || 1);

			dom.solo.textContent   = A.humaniseCount(killsSolo);
			dom.gangs.textContent  = A.humaniseCount(killsGangs);
			dom.losses.textContent = A.humaniseCount(losses);

			dom.solo.href   = `https://zkillboard.com/character/${getId()}/solo`;
			dom.gangs.href  = `https://zkillboard.com/character/${getId()}/kills`;
			dom.losses.href = `https://zkillboard.com/character/${getId()}/losses`;

			dom.solo.style.opacity   = ratioSolo;
			dom.gangs.style.opacity  = ratioGangs;
			dom.losses.style.opacity = ratioLosses;

			root.classList.toggle('ready', true);

			markIdle();
		}

	};

})(window.A);
