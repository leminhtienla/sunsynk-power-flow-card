import { svg } from 'lit';
import { DataDto, sunsynkPowerFlowCardConfig } from '../../../types';
import { Utils } from '../../../helpers/utils';

export function renderPV(
	id: string,
	x: string,
	y: string,
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
	height: number = 30,
) {
	// Only vary gradient id when efficiency > 0 and gradient is used.
	// When efficiency is 0, we render a stable grey stroke without a gradient to avoid paint churn.
	// Stable ID per PV element; Shadow DOM scoping prevents cross-card collisions
	const gradientId = `${id}LG`;
	const efficiencyMap = {
		pvtotal: 'totalPVEfficiency',
		pv1: 'PV1Efficiency',
		pv2: 'PV2Efficiency',
		pv3: 'PV3Efficiency',
		pv4: 'PV4Efficiency',
		pv5: 'PV5Efficiency',
		pv6: 'PV6Efficiency',
	};
	const efficiencyPropertyName = efficiencyMap[id] || 'totalPVEfficiency';
	// Map công suất (W) tương ứng từng nhánh PV -- dùng để grey RÕ RÀNG khi
	// nhánh đó = 0W, thay vì chỉ dựa gián tiếp vào solarColour tự dim theo
	// off_threshold (không chính xác bằng, và không áp dụng cho từng nhánh
	// riêng lẻ pv1/pv2/pv3/pv4, chỉ áp dụng cho tổng totalPV).
	const powerMap: Partial<Record<string, keyof DataDto>> = {
		pvtotal: 'totalPV',
		pv1: 'pv1PowerWatts',
		pv2: 'pv2PowerWatts',
		pv3: 'pv3PowerWatts',
		pv4: 'pv4PowerWatts',
		pv5: 'pv5PowerWatts',
		pv6: 'pv6PowerWatts',
	};
	const powerPropertyName = powerMap[id] || 'totalPV';
	const branchPower = Utils.toNum(
		data[powerPropertyName] as unknown as number,
		0,
	);
	// Coerce efficiency to a number and clamp to [0, 100] to ensure valid gradient offsets
	type EfficiencyKey =
		| 'totalPVEfficiency'
		| 'PV1Efficiency'
		| 'PV2Efficiency'
		| 'PV3Efficiency'
		| 'PV4Efficiency'
		| 'PV5Efficiency'
		| 'PV6Efficiency';
	const effKey = efficiencyPropertyName as EfficiencyKey as keyof DataDto;
	const efficiencyRaw = data[effKey] as unknown;
	const parsed =
		typeof efficiencyRaw === 'number'
			? efficiencyRaw
			: parseFloat(String(efficiencyRaw ?? '').replace('%', ''));
	const efficiency = Math.max(
		0,
		Math.min(100, Number.isFinite(parsed) ? (parsed as number) : 0),
	);
	const solarBaseColour = data.solarBaseColour;
	// Grey RÕ RÀNG khi nhánh PV này = 0W HOẶC Inverter đang Standby (đồng bộ
	// với các đường path pv1-4-line/solar-line, vốn đã grey theo cả 2 điều
	// kiện này) -- không phụ thuộc off_threshold gián tiếp qua solarColour
	// nữa. Dùng solarBaseColour (tĩnh) khi có công suất, đồng bộ đúng chuẩn
	// chung "màu riêng nhóm + grey theo flow".
	// Dùng ngưỡng nhỏ (<1W) thay vì so sánh chặt ===0 -- một số sensor trả
	// về sai số thập phân cực nhỏ (VD 0.001W) thay vì đúng số 0 tuyệt đối,
	// khiến so sánh chặt bị trượt và khung không grey dù thực tế = 0.
	const isBranchOff = Math.abs(branchPower) < 1 || data.isInverterStandby;
	const useGradient =
		[1, 3].includes(config.solar.efficiency) && efficiency > 0 && !isBranchOff;
	const strokeColor = isBranchOff ? 'grey' : solarBaseColour;
	const gradientUrl = useGradient ? `url(#${gradientId})` : strokeColor;
	let className = '';

	if (id === 'pv2' && config.solar.mppts === 1) {
		className = 'st12';
	} else if (id === 'pv3' && [1, 2].includes(config.solar.mppts)) {
		className = 'st12';
	} else if (id === 'pv4' && [1, 2, 3].includes(config.solar.mppts)) {
		className = 'st12';
	} else if (id === 'pv5' && [1, 2, 3, 4].includes(config.solar.mppts)) {
		className = 'st12';
	} else if (id === 'pv6' && [1, 2, 3, 4, 5].includes(config.solar.mppts)) {
		className = 'st12';
	}

	const style =
		id === 'pvtotal' && config.solar.mppts === 1 ? 'display: none;' : '';

	return svg`
		<svg
			id="${id}"
			x="${x}"
			y="${y}"
			width="70"
			height="${height}"
			viewBox="0 0 70 ${height}"
			overflow="visible"
		>
			${
				useGradient
					? svg`<defs>
						<linearGradient
							id="${gradientId}"
							x1="0%"
							x2="0%"
							y1="100%"
							y2="0%"
							gradientUnits="objectBoundingBox"
						>
							<stop offset="0%" stop-color="${solarBaseColour}" />
							<stop offset="${efficiency}%" stop-color="${solarBaseColour}" />
							<stop offset="${efficiency}%" stop-color="grey" />
							<stop offset="100%" stop-color="grey" />
						</linearGradient>
					</defs>`
					: svg``
			}
			<rect
				id="${id}"
				width="70"
				height="${height}"
				rx="4.5"
				ry="4.5"
				fill="none"
				stroke="${gradientUrl}"
				stroke-width="1"
				pointer-events="all"
				class="${className}"
				style="${style}"
			/>
		</svg>
	`;
}
