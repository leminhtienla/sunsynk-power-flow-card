// solar-elements.ts
import { html, svg } from 'lit';
import { localize } from '../../../localize/localize';
import { Utils } from '../../../helpers/utils';
import { DataDto, sunsynkPowerFlowCardConfig } from '../../../types';
import {
	UnitOfElectricalCurrent,
	UnitOfElectricPotential,
	UnitOfPower,
} from '../../../const';
import { icons } from '../../../helpers/icons';
import { renderPV } from '../../shared/pv/render-pv';
import { renderPath } from '../../../helpers/render-path';
import { renderCircle } from '../../../helpers/render-circle';
import { createTextWithPopup, renderText } from '../../../helpers/text-utils';

export const renderSolarElements = (
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
) => {
	const {
		solarBaseColour,
		decimalPlaces,
		totalPV,
		minLineWidth,
		solarShowDaily,
		largeFont,
		durationCur,
	} = data;

	const { auto_scale, efficiency, mppts, display_mode, invert_flow } =
		config.solar;

	// Label "DAILY SOLAR" + giá trị "22.2 kWh": grey khi kWh = 0, solarBaseColour
	// khi > 0. Dùng solarBaseColour (KHÔNG dùng solarColour) vì solarColour tự
	// động dim về grey khi công suất PV HIỆN TẠI = 0W (VD buổi tối) -- điều đó
	// không liên quan đến tổng kWh tích lũy trong ngày, gây hiển thị sai (22.2
	// kWh vẫn > 0 nhưng bị grey nhầm do PV tức thời = 0).
	const solarDailyColour = !solarShowDaily
		? 'transparent'
		: data.stateDayPVEnergy.toNum() > 0
			? solarBaseColour
			: 'grey';
	const solarDailyLabelColour = solarDailyColour;

	// Text công suất (W) từng nhánh PV: grey RIÊNG khi chính nhánh đó = 0W
	// (không dùng chung solarColour theo TỔNG PV -- nếu không, nhánh PV1=0W
	// vẫn hiện màu miễn tổng PV còn >0 do nhánh khác, sai chuẩn "grey theo
	// flow" của chính nó).
	const pvTotalTextColour = totalPV === 0 ? 'grey' : solarBaseColour;
	const pv1TextColour = data.pv1PowerWatts === 0 ? 'grey' : solarBaseColour;
	const pv2TextColour = data.pv3PowerWatts === 0 ? 'grey' : solarBaseColour;
	const pv3TextColour = data.pv2PowerWatts === 0 ? 'grey' : solarBaseColour;
	const pv4TextColour = data.pv4PowerWatts === 0 ? 'grey' : solarBaseColour;

	return html`
		<!-- Solar Elements -->
		<svg
			id="Solar"
			style="overflow: visible; display: ${
				!config.show_solar ? 'none' : 'inline'
			};"
			x="3%"
			y="2.5%"
		>
			${renderPV('pvtotal', '51', '172', data, config)}
			${renderPV('pv1', '0', '40', data, config)}
			${renderPV('pv3', '101', '40', data, config)}
			${renderPV('pv2', '0', '100', data, config)}
			${renderPV('pv4', '101', '100', data, config)}
			${renderText(
				'pv1_name',
				0,
				78.5,
				!config.show_solar,
				'st3 st8 left-align',
				pv1TextColour,
				config.solar.pv1_name || localize('common.pv1_name'),
				true,
			)}
			${renderText(
				'pv1_efficiency',
				0,
				90,
				[0, 1].includes(efficiency),
				[2, 3].includes(efficiency) ? 'st3 st8 left-align' : 'st12',
				pv1TextColour,
				`${data.PV1Efficiency}%`,
				true,
			)}
			${renderText(
				'pv2_name',
				99,
				78.5,
				[1, 2].includes(mppts),
				'st3 st8 left-align',
				pv2TextColour,
				config.solar.pv3_name || localize('common.pv3_name'),
				true,
			)}
			${renderText(
				'pv2_efficiency',
				99,
				90,
				[1, 2].includes(mppts) || [0, 1].includes(efficiency),
				[2, 3].includes(efficiency) ? 'st3 st8 left-align' : 'st12',
				pv2TextColour,
				`${data.PV3Efficiency}%`,
				true,
			)}
			${renderText(
				'pv3_name',
				0,
				139,
				mppts === 1,
				'st3 st8 left-align',
				pv3TextColour,
				config.solar.pv2_name || localize('common.pv2_name'),
				true,
			)}
			${renderText(
				'pv3_efficiency',
				0,
				150,
				mppts === 1 || [0, 1].includes(efficiency),
				[2, 3].includes(efficiency) ? 'st3 st8 left-align' : 'st12',
				pv3TextColour,
				`${data.PV2Efficiency}%`,
				true,
			)}
			${renderText(
				'pv4_name',
				99,
				139,
				[1, 2, 3].includes(mppts),
				'st3 st8 left-align',
				pv4TextColour,
				config.solar.pv4_name || localize('common.pv4_name'),
				true,
			)}
			${renderText(
				'pv4_efficiency',
				99,
				150,
				[1, 2, 3].includes(mppts) || [0, 1].includes(efficiency),
				[2, 3].includes(efficiency) ? 'st3 st8 left-align' : 'st12',
				pv4TextColour,
				`${data.PV4Efficiency}%`,
				true,
			)}
			${renderText(
				'total_pv_efficiency',
				51,
				212,
				[0, 1].includes(efficiency) || mppts === 1,
				[2, 3].includes(efficiency) ? 'st3 st8 left-align' : 'st12',
				pvTotalTextColour,
				`${data.totalPVEfficiency}%`,
				true,
			)}
			${renderText(
				'daily_solar',
				0,
				29,
				display_mode === 1,
				'st3 left-align',
				solarDailyLabelColour,
				config.solar.custom_label || localize('common.daily_solar'),
				false,
			)}
			${renderText(
				'remaining_solar',
				0,
				29,
				display_mode === 2,
				'st3 left-align',
				solarDailyLabelColour,
				config.solar.custom_label || localize('common.daily_solar_left'),
				false,
			)}
			${renderText(
				'total_solar_generation',
				0,
				29,
				display_mode === 3,
				'st3 left-align',
				solarDailyLabelColour,
				config.solar.custom_label || localize('common.total_solar_generation'),
				false,
			)}
			${renderPath(
				'pv1-line',
				mppts === 1
					? config.wide
						? 'M 86 175 M 278 250 L 96 250 Q 86 250 86 240 L 86 56 H 70'
						: 'M 86 175 M 155 250 L 96 250 Q 86 250 86 240 L 86 56 H 70'
					: 'M 86 172 L 86 66 Q 86 56 76 56 L 70 56',
				true,
				// Khi Inverter Standby HOẶC chính nhánh PV1 này = 0W -> grey
				// (trước đây chỉ check Standby, khiến đường vẫn hiện màu dù
				// nhánh này không có công suất).
				data.isInverterStandby || data.pv1PowerWatts === 0
					? 'grey'
					: solarBaseColour,
				data.pv1LineWidth,
			)}
			${renderCircle(
				'pv1-dot',
				Math.min(2 + data.pv1LineWidth + Math.max(minLineWidth - 2, 0), 8),
				data.isInverterStandby || !(data.pv1PowerWatts > 0)
					? 'transparent'
					: solarBaseColour,
				durationCur['pv1'],
				'1;0',
				'#pv1-line',
				invert_flow,
			)}
			${renderPath(
				'pv2-line',
				'M 86 172 L 86 66 Q 86 56 96 56 L 101 56',
				![1, 2].includes(mppts),
				data.isInverterStandby || data.pv3PowerWatts === 0
					? 'grey'
					: solarBaseColour,
				data.pv3LineWidth,
			)}
			${renderCircle(
				'pv2-dot',
				Math.min(2 + data.pv3LineWidth + Math.max(minLineWidth - 2, 0), 8),
				data.isInverterStandby || !(data.pv3PowerWatts > 0)
					? 'transparent'
					: solarBaseColour,
				durationCur['pv2'],
				'1;0',
				'#pv2-line',
				invert_flow,
			)}
			${renderPath(
				'pv3-line',
				'M 86 172 L 86 125 Q 86 115 76 115 L 70 115',
				mppts !== 1,
				data.isInverterStandby || data.pv2PowerWatts === 0
					? 'grey'
					: solarBaseColour,
				data.pv2LineWidth,
			)}
			${renderCircle(
				'pv3-dot',
				Math.min(2 + data.pv2LineWidth + Math.max(minLineWidth - 2, 0), 8),
				data.isInverterStandby || !(data.pv2PowerWatts > 0)
					? 'transparent'
					: solarBaseColour,
				durationCur['pv3'],
				'1;0',
				'#pv3-line',
				invert_flow,
			)}
			${renderPath(
				'pv4-line',
				'M 86 172 L 86 125 Q 86 115 96 115 L 101 115',
				![1, 2, 3].includes(mppts),
				data.isInverterStandby || data.pv4PowerWatts === 0
					? 'grey'
					: solarBaseColour,
				data.pv4LineWidth,
			)}
			${renderCircle(
				'pv4-dot',
				Math.min(2 + data.pv4LineWidth + Math.max(minLineWidth - 2, 0), 8),
				data.isInverterStandby || !(data.pv4PowerWatts > 0)
					? 'transparent'
					: solarBaseColour,
				durationCur['pv4'],
				'1;0',
				'#pv4-line',
				invert_flow,
			)}
			${renderPath(
				'solar-line',
				config.wide
					? 'M 278 250 L 96 250 Q 86 250 86 240 L 86 202'
					: 'M 155 250 L 96 250 Q 86 250 86 240 L 86 202',
				mppts !== 1,
				// Đường PV -> Inverter: khi Inverter Standby HOẶC tổng PV = 0W
				// -> grey, tắt animation.
				data.isInverterStandby || totalPV === 0 ? 'grey' : solarBaseColour,
				data.solarLineWidth,
			)}
			${renderCircle(
				'solar-dot',
				Math.min(2 + data.solarLineWidth + Math.max(minLineWidth - 2, 0), 8),
				data.isInverterStandby || !(totalPV > 0)
					? 'transparent'
					: solarBaseColour,
				durationCur['solar'],
				'1;0',
				'#solar-line',
				invert_flow,
			)}
			${
				config.solar?.navigate
					? svg`
                    <a href="#" @click=${(e) => Utils.handleNavigation(e, config.solar.navigate)}>
                        <svg xmlns="http://www.w3.org/2000/svg" id="sun" x="80.21" y="-0.5" width="40" height="40"
                            viewBox="0 0 24 24">
                            <path fill="${solarDailyColour}"
                                d="${icons.sun}"/>
                        </svg>
                    </a>
                    <svg xmlns="http://www.w3.org/2000/svg" id="sun-mirror" x="52.78" y="-0.5" width="40" height="40"
                        viewBox="0 0 24 24">
                        <g transform="scale(-1,1) translate(-24,0)">
                            <path fill="${solarDailyColour}"
                                d="${icons.sunRayOnly}"/>
                        </g>
                    </svg>`
					: svg`
                    <svg xmlns="http://www.w3.org/2000/svg" id="sun" x="80.21" y="-0.5" width="40" height="40"
                        viewBox="0 0 24 24">
                        <path fill="${solarDailyColour}"
                            d="${icons.sun}"/>
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" id="sun-mirror" x="52.78" y="-0.5" width="40" height="40"
                        viewBox="0 0 24 24">
                        <g transform="scale(-1,1) translate(-24,0)">
                            <path fill="${solarDailyColour}"
                                d="${icons.sunRayOnly}"/>
                        </g>
                    </svg>`
			}
			<a
				href="#"
				@click=${(e) => Utils.handlePopup(e, config.entities.solar_sell_247)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="solar_sell_on"
					x="96"
					y="197"
					width="18"
					height="18"
					viewBox="0 0 30 30"
				>
					<path
						display="${
							!config.entities.solar_sell_247 ||
							config.entities.solar_sell_247 === 'none' ||
							data.stateSolarSell.state === 'off' ||
							data.stateSolarSell.state === '0' ||
							!['1', 'on'].includes(data.stateSolarSell.state)
								? 'none'
								: ''
						}"
						fill="${solarBaseColour}"
						d="${icons.solarSellOn}"
					/>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="solar_sell_off"
					x="96"
					y="197"
					width="18"
					height="18"
					viewBox="0 0 30 30"
				>
					<path
						display="${
							!config.entities.solar_sell_247 ||
							config.entities.solar_sell_247 === 'none' ||
							data.stateSolarSell.state === 'on' ||
							data.stateSolarSell.state === '1' ||
							!['0', 'off'].includes(data.stateSolarSell.state)
								? 'none'
								: ''
						}"
						fill="${solarBaseColour}"
						d="${icons.solarSellOff}"
					/>
				</svg>
			</a>
			${createTextWithPopup(
				'daily_solar_value',
				0,
				15,
				display_mode === 1 && data.stateDayPVEnergy.isValid(),
				'st10 left-align',
				solarDailyColour,
				data.stateDayPVEnergy.toPowerString(true, data.decimalPlacesEnergy),
				(e) => Utils.handlePopup(e, config.entities.day_pv_energy_108),
			)}
			${createTextWithPopup(
				'remaining_solar_value',
				43.5,
				15,
				display_mode === 2 && data.stateDayPVEnergy.isValid(),
				'st10 left-align',
				solarDailyColour,
				`${data.stateDayPVEnergy.toPowerString(true, data.decimalPlacesEnergy)} / ${data.remainingSolar}`,
				(e) => Utils.handlePopup(e, config.entities.day_pv_energy_108),
			)}
			${createTextWithPopup(
				'total_solar_value',
				43.5,
				15,
				display_mode === 3 && data.stateDayPVEnergy.isValid(),
				'st10 left-align',
				solarDailyColour,
				`${data.stateDayPVEnergy.toPowerString(true, data.decimalPlacesEnergy)} / ${data.totalSolarGeneration}`,
				(e) => Utils.handlePopup(e, config.entities.day_pv_energy_108),
			)}
			${
				config.entities?.pv_total
					? svg`
                    ${createTextWithPopup(
											'pvtotal_power',
											87,
											187,
											mppts === 1 || !data.statePVTotal.isValid(),
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											pvTotalTextColour,
											auto_scale
												? config.entities?.pv_total
													? `${Utils.convertValueNew(totalPV, data.statePVTotal?.getUOM(), decimalPlaces)}`
													: `${Utils.convertValue(totalPV, decimalPlaces) || 0}`
												: `${Utils.toNum(totalPV || 0, 0)} ${UnitOfPower.WATT}`,
											(e) => Utils.handlePopup(e, config.entities.pv_total),
											true,
										)}`
					: svg`
                    ${renderText(
											'pvtotal_power',
											87,
											187,
											mppts === 1 || !data.statePVTotal.isValid(),
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											pvTotalTextColour,
											auto_scale
												? config.entities?.pv_total
													? `${Utils.convertValueNew(totalPV, data.statePVTotal?.getUOM(), decimalPlaces)}`
													: `${Utils.convertValue(totalPV, decimalPlaces) || 0}`
												: `${Utils.toNum(totalPV || 0, 0)} ${UnitOfPower.WATT}`,
											true,
										)}`
			}
			${createTextWithPopup(
				'pv1_power_186',
				36.5,
				56.5,
				!data.statePV1Power.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				pv1TextColour,
				auto_scale
					? `${Utils.convertValue(data.pv1PowerWatts, decimalPlaces) || 0}`
					: `${Utils.toNum(data.pv1PowerWatts || 0, 0)} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.pv1_power_186),
				true,
			)}
			${createTextWithPopup(
				'pv2_power_187',
				137,
				56.5,
				[1, 2].includes(mppts) || !data.statePV3Power.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				pv2TextColour,
				auto_scale
					? `${Utils.convertValue(data.pv3PowerWatts, decimalPlaces) || 0}`
					: `${Utils.toNum(data.pv3PowerWatts || 0, 0)} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.pv3_power_188),
				true,
			)}
			${createTextWithPopup(
				'pv3_power_188',
				36.5,
				117,
				mppts === 1 || !data.statePV2Power.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				pv3TextColour,
				auto_scale
					? `${Utils.convertValue(data.pv2PowerWatts, decimalPlaces) || 0}`
					: `${Utils.toNum(data.pv2PowerWatts || 0, 0)} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.pv2_power_187),
				true,
			)}
			${createTextWithPopup(
				'pv4_power_189',
				137,
				117,
				[1, 2, 3].includes(mppts) || !data.statePV4Power.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				pv4TextColour,
				auto_scale
					? `${Utils.convertValue(data.pv4PowerWatts, decimalPlaces) || 0}`
					: `${Utils.toNum(data.pv4PowerWatts || 0, 0)} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.pv4_power_189),
				true,
			)}
			${createTextWithPopup(
				'pv1_voltage',
				41,
				78.5,
				!config.entities.pv1_voltage_109 ||
					config.entities.pv1_voltage_109 === 'none' ||
					!data.statePV1Voltage.isValid(),
				'st3 left-align',
				pv1TextColour,
				`${Utils.formatNumberLocale(
					data.statePV1Voltage.toNum(1),
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.pv1_voltage_109),
				true,
			)}
			${createTextWithPopup(
				'pv1_current',
				41,
				90,
				!config.entities.pv1_current_110 ||
					config.entities.pv1_current_110 === 'none' ||
					!data.statePV1Current.isValid(),
				'st3 left-align',
				pv1TextColour,
				`${Utils.formatNumberLocale(
					data.statePV1Current.toNum(1),
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.pv1_current_110),
				true,
			)}
			${createTextWithPopup(
				'pv2_voltage',
				142,
				78.5,
				!config.entities.pv3_voltage_113 ||
					config.entities.pv3_voltage_113 === 'none' ||
					[1, 2].includes(mppts) ||
					!data.statePV3Voltage.isValid(),
				'st3 left-align',
				pv2TextColour,
				`${Utils.formatNumberLocale(
					data.statePV3Voltage.toNum(1),
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.pv3_voltage_113),
				true,
			)}
			${createTextWithPopup(
				'pv2_current',
				142,
				90,
				!config.entities.pv3_current_114 ||
					config.entities.pv3_current_114 === 'none' ||
					[1, 2].includes(mppts) ||
					!data.statePV3Current.isValid(),
				'st3 left-align',
				pv2TextColour,
				`${Utils.formatNumberLocale(
					data.statePV3Current.toNum(1),
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.pv3_current_114),
				true,
			)}
			${createTextWithPopup(
				'pv3_voltage',
				41,
				139,
				!config.entities.pv2_voltage_111 ||
					config.entities.pv2_voltage_111 === 'none' ||
					mppts === 1 ||
					!data.statePV2Voltage.isValid(),
				'st3 left-align',
				pv3TextColour,
				`${Utils.formatNumberLocale(
					data.statePV2Voltage.toNum(1),
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.pv2_voltage_111),
				true,
			)}
			${createTextWithPopup(
				'pv3_current',
				41,
				150,
				!config.entities.pv2_current_112 ||
					config.entities.pv2_current_112 === 'none' ||
					mppts === 1 ||
					!data.statePV2Current.isValid(),
				'st3 left-align',
				pv3TextColour,
				`${Utils.formatNumberLocale(
					data.statePV2Current.toNum(1),
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.pv2_current_112),
				true,
			)}
			${createTextWithPopup(
				'pv4_voltage',
				142,
				139,
				!config.entities.pv4_voltage_115 ||
					config.entities.pv4_voltage_115 === 'none' ||
					[1, 2, 3].includes(mppts) ||
					!data.statePV4Voltage.isValid(),
				'st3 left-align',
				pv4TextColour,
				`${Utils.formatNumberLocale(
					data.statePV4Voltage.toNum(1),
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.pv4_voltage_115),
				true,
			)}
			${createTextWithPopup(
				'pv4_current',
				142,
				150,
				!config.entities.pv4_current_116 ||
					config.entities.pv4_current_116 === 'none' ||
					[1, 2, 3].includes(mppts) ||
					!data.statePV4Current.isValid(),
				'st3 left-align',
				pv4TextColour,
				`${Utils.formatNumberLocale(
					data.statePV4Current.toNum(1),
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.pv4_current_116),
				true,
			)}
			${createTextWithPopup(
				'environ_temp',
				74,
				32,
				!data.stateEnvironmentTemp.isValid(),
				config.entities?.environment_temp ? 'st3 left-align' : 'st12',
				solarBaseColour,
				`${data.stateEnvironmentTemp.toNum(1)}°`,
				(e) => Utils.handlePopup(e, config.entities.environment_temp),
				true,
			)}
		</svg>
	`;
};
