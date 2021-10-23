((A) => {
	'use strict';

	const TEMPLATE = document.getElementById('templateShipStatsTile');

	A.ShipStatsTile = (stats = {}) => {
		const root = document.importNode(TEMPLATE.content, true).firstChild;
		const dom  = {
			name:   root.querySelector('.ShipStatsTile-name'),
			stats:  root.querySelector('.ShipStatsTile-stats'),
			losses: root.querySelector('.ShipStatsTile-losses'),
			kills:  root.querySelector('.ShipStatsTile-kills'),
		};

		setShipStats(stats);

		return {
			render,
			setShipStats,
		};


		function render() { return root; }


		function setShipStats(stats = {}) {
			dom.name.textContent = stats?.info?.name || '???';

			root.href          = `https://zkillboard.com/ship/${stats.id}`;
			root.style.opacity = stats.ratio || 1;
			root.title         = [
				A.humanisePlural(stats.kills  || 0, 'recent kill', 'recent kills'),
				A.humanisePlural(stats.losses || 0, 'recent loss', 'recent losses'),
				`Last fight: ${A.humaniseDate(stats.dateLastSeen)}`,
			].join("\n");

			const fightsTotal = stats.kills + stats.losses;
			const ratioKills  = stats.kills  / (fightsTotal || 1);
			const ratioLosses = stats.losses / (fightsTotal || 1);

			root.style.backgroundColor = getColorForLossRatio(ratioLosses);

			dom.losses.style.width = `${ratioLosses * 100}%`;
			dom.kills.style.width  = `${ratioKills * 100}%`;
		}


		function getColorForLossRatio(ratio) {
			const hueMax      = 120;
			const hueForRatio = Math.round(ratio * hueMax);

			return `hsla(${hueForRatio}, 100%, 50%, 0.1)`;
		}

	};

})(window.A);
