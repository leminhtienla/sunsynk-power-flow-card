// grid-elements.ts
import { svg, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { guard } from 'lit/directives/guard.js';
import { localize } from '../../../localize/localize';
import { Utils } from '../../../helpers/utils';
import { DataDto, sunsynkPowerFlowCardConfig } from '../../../types';
import { icons } from '../../../helpers/icons';
import {
	UnitOfElectricPotential,
	UnitOfPower,
	validGridConnected,
	validGridDisconnected,
} from '../../../const';
import { getNonEssentialIconConfigs } from '../../shared/grid/icon-configs';
import { renderStaticGridIcon } from '../../shared/grid/render-static-grid-icon';
import { renderIcon } from '../../../helpers/render-icon';
import { createTextWithPopup, renderText } from '../../../helpers/text-utils';
import { renderPath } from '../../../helpers/render-path';
import { renderCircle } from '../../../helpers/render-circle';

const renderGridIcons = (data: DataDto, config: sunsynkPowerFlowCardConfig) => {
	const isGridConnected = validGridConnected.includes(
		data.gridStatus.toLowerCase(),
	);
	const isGridDisconnected = validGridDisconnected.includes(
		data.gridStatus.toLowerCase(),
	);
	const totalGridPower = data.totalGridPower;
	// gridColour tự dùng noGridColour (mặc định cyan #00ffff, KHÔNG PHẢI
	// grey) khi công suất Lưới gần 0 -- đây là khái niệm riêng của base
	// project, không khớp quy tắc "grey theo flow" thống nhất của card này.
	// Ép grey rõ ràng ở đây để icon cột điện luôn nhất quán với khung/text
	// Grid thật (gridRealBoxColour) và icon EVN thứ 2 (customGridIconColour).
	const gridColour =
		Math.abs(Utils.toNum(totalGridPower, 0)) < 1 ? 'grey' : data.gridColour;
	const three_phase = config.inverter.three_phase;

	return svg`
        <svg xmlns="http://www.w3.org/2000/svg" id="transmission_on"
            x="${three_phase ? '404' : '389'}"
            y="${three_phase ? '339' : '308'}"
            width="${three_phase ? '34' : '65'}"
            height="${three_phase ? '34' : '65'}" viewBox="0 0 24 24">
            <path class="${isGridDisconnected ? 'st12' : ''}"
                fill="${gridColour}"
                display="${totalGridPower < 0 || config.grid.import_icon ? 'none' : ''}"
                d="${icons.gridOn}"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" id="transmission_off"
            x="${three_phase ? '404' : '389'}"
            y="${three_phase ? '339' : '308'}"
            width="${three_phase ? '34' : '65'}"
            height="${three_phase ? '34' : '65'}" viewBox="0 0 24 24">
            <path class="${isGridConnected ? 'st12' : ''}"
                fill="${data.gridOffColour}" display="${config.grid.disconnected_icon ? 'none' : ''}"
                d="${icons.gridOff}"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" id="grid_export"
            x="${three_phase ? '404' : '389'}"
            y="${three_phase ? '339' : '308'}"
            width="${three_phase ? '34' : '65'}"
            height="${three_phase ? '34' : '65'}" viewBox="0 0 24 24">
            <path class="${isGridDisconnected ? 'st12' : ''}"
                fill="${gridColour}"
                display="${totalGridPower >= 0 || config.grid.export_icon ? 'none' : ''}"
                d="${icons.gridExport}"/>
        </svg>
    `;
};

export const renderGridElements = (
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
) => {
	const {
		nonessentialLoads,
		showNonessential,
		decimalPlaces,
		gridColour,
		largeFont,
		totalGridPower,
		autoScaledGridPower,
		autoScaledInverterPower,
	} = data;

	const { auto_scale, invert_flow } = config.grid;

	// Màu riêng cho khung Grid-tie (V/Hz) -- LUÔN dùng gridColour riêng
	// (giống khung Grid W/V/H thật cạnh EVN), không còn pha trộn động theo
	// PV/Pin nữa. Grey khi mất Lưới (V/Hz Grid-tie =0) hoặc (không Standby
	// và) không có công suất Inverter đẩy ra. Dùng ngưỡng nhỏ (<1W) thay vì
	// so sánh chặt ===0 -- sensor có thể trả về sai số thập phân cực nhỏ.
	const gridTieBusColour =
		!data.gridConnected ||
		(!data.isInverterStandby &&
			Math.abs(Utils.toNum(data.displayInverterPower, 0)) < 1)
			? 'grey'
			: gridColour;

	// Khung Grid thật (W/V/Hz cạnh EVN, đo bằng thiết bị ngoài) -- grey khi
	// công suất Lưới (totalGridPower) ~0 (không mua/bán), đồng bộ đúng chuẩn
	// chung "màu riêng nhóm + grey theo flow" như các nhánh PV/Pin/Inverter/
	// EPS/Grid-tie đã có, chứ không phải luôn hiện gridColour cố định.
	const gridRealBoxColour =
		Math.abs(Utils.toNum(totalGridPower, 0)) < 1 ? 'grey' : gridColour;

	const { three_phase } = config.inverter;

	return html`
		<!-- Grid Elements -->
		<svg
			id="Grid"
			style="overflow: visible; display: ${!config.show_grid
				? 'none'
				: 'inline'};"
			x="${config.wide ? '30%' : '3%'}"
			y="2.5%"
		>
			<svg id="nonessential3" style="overflow: visible">
				<rect
					id="noness3"
					x="266"
					y="310"
					width="35"
					height="20"
					rx="4.5"
					ry="4.5"
					display="${nonessentialLoads === 3 &&
					(config.battery.hide_soc || config.wide)
						? ''
						: 'none'}"
					fill="none"
					stroke="${data.dynamicColourNonEssentialLoad3}"
					pointer-events="all"
					class="${!showNonessential || nonessentialLoads === 1 ? 'st12' : ''}"
				/>
				${renderText(
					'noness3',
					284,
					338,
					!showNonessential || [0, 1, 2].includes(nonessentialLoads),
					config.battery.hide_soc || config.wide ? 'st3 st8' : 'st12',
					data.dynamicColourNonEssentialLoad3,
					config.grid.load3_name,
					true,
				)}
				<g
					display="${!showNonessential || [0, 1, 2].includes(nonessentialLoads)
						? 'none'
						: ''}"
				>
					${renderIcon(
						undefined,
						data.iconNonessentialLoad3,
						'nonessload3-icon',
						269,
						341,
						30,
						30,
						(config.battery.hide_soc || config.wide) && nonessentialLoads === 3,
					)}
				</g>
				${createTextWithPopup(
					'noness3_value',
					283,
					321,
					!showNonessential ||
						[0, 1, 2].includes(nonessentialLoads) ||
						!data.stateNonessentialLoad3.isValid(),
					config.battery.hide_soc || config.wide ? 'st3' : 'st12',
					data.dynamicColourNonEssentialLoad3,
					data.stateNonessentialLoad3.toPowerString(auto_scale, decimalPlaces),
					(e) => Utils.handlePopup(e, config.entities.non_essential_load3),
					true,
				)}
				${createTextWithPopup(
					'non_ess_load3_value_extra',
					300,
					305,
					config.entities?.non_essential_load3_extra &&
						nonessentialLoads === 3 &&
						data.stateNonEssentialLoad3Extra.isValid() &&
						config.show_grid &&
						config.wide &&
						showNonessential,
					'st3 right-align',
					data.dynamicColourNonEssentialLoad3,
					`${Utils.formatNumberLocale(
						data.stateNonEssentialLoad3Extra.toNum(1),
						1,
					)} ${data.stateNonEssentialLoad3Extra?.getUOM()}`,
					(e) =>
						Utils.handlePopup(e, config.entities.non_essential_load3_extra),
				)}
			</svg>
			<rect
				x="${[1, 2].includes(config.solar?.mppts) ? '259' : '274'}"
				y="162"
				width="70"
				height="50"
				rx="10.5"
				ry="10.5"
				fill="none"
				stroke="${gridTieBusColour}"
				pointer-events="all"
			/>
			<rect
				x="386"
				y="225"
				width="70"
				height="70"
				rx="10.5"
				ry="10.5"
				fill="none"
				stroke="${gridRealBoxColour}"
				pointer-events="all"
			/>
			<rect
				id="nonesstotal"
				x="304"
				y="265"
				width="70"
				height="30"
				rx="4.5"
				ry="4.5"
				fill="none"
				stroke="${gridColour}"
				pointer-events="all"
				class="${!showNonessential ? 'st12' : ''}"
			/>
			<rect
				id="noness1"
				x="304"
				y="310"
				width="70"
				height="20"
				rx="4.5"
				ry="4.5"
				display="${nonessentialLoads === 1 ? '' : 'none'}"
				fill="none"
				stroke="${data.dynamicColourNonEssentialLoad1}"
				pointer-events="all"
				class="${!showNonessential ? 'st12' : ''}"
			/>
			<rect
				id="noness1"
				x="303"
				y="310"
				width="35"
				height="20"
				rx="4.5"
				ry="4.5"
				display="${[2, 3].includes(nonessentialLoads) ? '' : 'none'}"
				fill="none"
				stroke="${data.dynamicColourNonEssentialLoad1}"
				pointer-events="all"
				class="${!showNonessential || nonessentialLoads === 1 ? 'st12' : ''}"
			/>
			<rect
				id="noness2"
				x="340"
				y="310"
				width="35"
				height="20"
				rx="4.5"
				ry="4.5"
				display="${[2, 3].includes(nonessentialLoads) ? '' : 'none'}"
				fill="none"
				stroke="${data.dynamicColourNonEssentialLoad2}"
				pointer-events="all"
				class="${!showNonessential || nonessentialLoads === 1 ? 'st12' : ''}"
			/>
			${renderText(
				'noness1',
				340,
				338,
				!showNonessential || [0, 2, 3].includes(nonessentialLoads),
				'st3 st8',
				data.dynamicColourNonEssentialLoad1,
				config.grid.load1_name,
				true,
			)}
			${renderText(
				'noness2',
				321,
				338,
				!showNonessential || [0, 1].includes(nonessentialLoads),
				'st3 st8',
				data.dynamicColourNonEssentialLoad1,
				config.grid.load1_name,
				true,
			)}
			${renderText(
				'noness2',
				358,
				338,
				!showNonessential || [0, 1].includes(nonessentialLoads),
				'st3 st8',
				data.dynamicColourNonEssentialLoad2,
				config.grid.load2_name,
				true,
			)}
			${renderText(
				'grid_name',
				421,
				377,
				true,
				'st3 st8',
				gridColour,
				config.grid.grid_name || localize('common.grid_name'),
			)}
			${renderText(
				'daily_grid_buy',
				!showNonessential ? '311' : '347',
				!showNonessential
					? '368'
					: config.entities?.max_sell_power
						? '256'
						: '253',
				data.gridShowDailyBuy !== true,
				'st3 left-align',
				data.stateDayGridImport.toNum() > 0 ? gridColour : 'grey',
				config.grid.label_daily_grid_buy || localize('common.daily_grid_buy'),
				true,
			)}
			${renderText(
				'daily_grid_sell',
				!showNonessential ? '311' : '347',
				!showNonessential
					? '337'
					: config.entities?.max_sell_power
						? '225'
						: '222',
				data.gridShowDailySell !== true,
				'st3 left-align',
				data.stateDayGridExport.toNum() > 0 ? gridColour : 'grey',
				config.grid.label_daily_grid_sell || localize('common.daily_grid_sell'),
				true,
			)}
			${renderText(
				'noness',
				340,
				377,
				!showNonessential,
				'st3 st8',
				gridColour,
				config.grid.nonessential_name || localize('common.nonessential_name'),
				true,
			)}
			<svg id="grid-flow">
				${renderPath(
					'grid-line',
					[1, 2].includes(config.solar?.mppts) ? 'M 329 187 L 411 187 Q 421 187 421 197 L421 225' : 'M 344 187 L 411 187 Q 421 187 421 197 L421 225',
					true,
					// Dùng gridRealBoxColour (đã ép grey đúng chuẩn khi
					// |totalGridPower|<1) thay vì gridColour trực tiếp --
					// gridColour tự dùng noGridColour (mặc định cyan, không
					// phải grey) khi công suất gần 0, không khớp quy tắc
					// thống nhất của card.
					gridRealBoxColour,
					data.gridLineWidth,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.gridLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					totalGridPower <= 0 ? 'transparent' : gridColour,
					data.durationCur['grid'],
					'1;0',
					'#grid-line',
					invert_flow === true,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.gridLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					totalGridPower >= 0 ? 'transparent' : gridColour,
					data.durationCur['grid'],
					'0;1',
					'#grid-line',
					invert_flow === true,
					data.inverterCycleColours,
				)}
			</svg>
			<svg id="grid1-flow">
				${renderPath(
					'grid-line1',
					three_phase ? 'M 421 295 L 421 337' : 'M 421 295 L 421 310.5',
					true,
					gridRealBoxColour,
					data.gridLineWidth,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.gridLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					totalGridPower <= 0 ? 'transparent' : gridColour,
					data.durationCur['grid'] / 1.5,
					'1;0',
					'#grid-line1',
					invert_flow === true,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.gridLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					totalGridPower >= 0 ? 'transparent' : gridColour,
					data.durationCur['grid'] / 1.5,
					'0;1',
					'#grid-line1',
					invert_flow === true,
					data.inverterCycleColours,
				)}
			</svg>
			<svg id="ne1-flow">
				${renderPath(
					'ne-line1',
					'M 339 295 L 339 310',
					showNonessential,
					gridColour,
					data.nonessLineWidth,
				)}
				${renderCircle(
					'ne-dot1',
					Math.min(
						2 + data.nonessLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					data.nonessentialPower <= 0 || !showNonessential
						? 'transparent'
						: gridColour,
					data.durationCur['ne'] / 1.5,
					'0;1',
					'#ne-line1',
					invert_flow === true,
				)}
			</svg>
			<svg id="ne-flow">
				${renderPath(
					'ne-line',
					'M 339 265 L 339 188',
					showNonessential,
					gridColour,
					data.nonessLineWidth,
				)}
				${renderCircle(
					'ne-dot',
					Math.min(
						2 + data.nonessLineWidth + Math.max(data.minLineWidth - 2, 0),
						5,
					),
					data.nonessentialPower <= 0 || !showNonessential
						? 'transparent'
						: gridColour,
					data.durationCur['ne'],
					'1;0',
					'#ne-line',
					invert_flow === true,
				)}
			</svg>
			<svg id="grid2-flow">
				${renderPath(
					'grid2-line',
					[1, 2].includes(config.solar?.mppts) ? (config.wide ? 'M143 187 259 187' : 'M215 187 259 187') : (config.wide ? 'M143 187 274 187' : 'M215 187 274 187'),
					true,
					// Đồng bộ với 'inverter-path' (icon inverter -> ô Inverter,
					// xem inverter-elements.ts) vì cả 2 cùng thể hiện 1 luồng
					// công suất liên tục do Inverter xuất ra -> phải luôn cùng
					// công thức màu để không lệch nhau khi trạng thái đổi. Luôn
					// grey khi Standby (không phụ thuộc gridConnected) vì đây là
					// phần Inverter tự đóng góp, không phải bus AC bypass qua Lưới.
					data.isInverterStandby ? 'grey' : gridTieBusColour,
					data.inverterLineWidth,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.inverterLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					// Đây là dây dẫn từ Inverter sang khung Grid-tie: phản ánh
					// công suất Inverter xuất ra (PV+Pin), không phải công suất
					// mua/bán lưới thực tế (autoScaledGridPower).
					// Path 'grid2-line' đầu = phía Inverter, cuối = phía Grid-tie.
					// Công suất dương (Inverter đẩy ra) → đi từ đầu (0) đến cuối (1).
					!data.gridConnected ||
					data.isInverterStandby ||
					autoScaledInverterPower < 1
						? 'transparent'
						: gridTieBusColour,
					data.durationCur['grid2'],
					'0;1',
					'#grid2-line',
					// Invert Flow chỉ áp dụng cho đoạn "icon grid -> ô W grid ->
					// grid-tie" (grid-line, grid-line1). Đoạn "Inverter W <->
					// Grid-tie W" (grid2-line) luôn dùng chiều mặc định, không phụ
					// thuộc switch invert_flow.
					false,
					data.inverterCycleColours,
				)}
				${renderCircle(
					'grid-dot',
					Math.min(
						2 + data.inverterLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					!data.gridConnected ||
					data.isInverterStandby ||
					autoScaledInverterPower > -1
						? 'transparent'
						: gridTieBusColour,
					data.durationCur['grid2'],
					'1;0',
					'#grid2-line',
					false,
					data.inverterCycleColours,
				)}
			</svg>
			${config.grid?.navigate
				? svg`
                    <a href="#" @click=${(e) => Utils.handleNavigation(e, config.grid.navigate)}>
							${guard(
								[
									data.gridStatus,
									Math.abs(data.totalGridPower) < 1,
									data.totalGridPower >= 0,
									data.gridColour,
									three_phase,
									config.grid.import_icon,
									config.grid.export_icon,
									config.grid.disconnected_icon,
								],
								() => renderGridIcons(data, config),
							)}
                    </a>`
				: svg`
                    <a href="#" @click=${(e) => Utils.handlePopup(e, config.entities.grid_connected_status_194)}>
							${guard(
								[
									data.gridStatus,
									Math.abs(data.totalGridPower) < 1,
									data.totalGridPower >= 0,
									data.gridColour,
									three_phase,
									config.grid.import_icon,
									config.grid.export_icon,
									config.grid.disconnected_icon,
								],
								() => renderGridIcons(data, config),
							)}
                    </a>`}
			${config.grid?.navigate
				? svg`
                    <a href="#" @click=${(e) => Utils.handleNavigation(e, config.grid.navigate)}>
                        <g display="${config.show_grid && (config.grid.import_icon || config.grid.disconnected_icon || config.grid.export_icon) ? '' : 'none'}">
                            ${renderIcon(
															undefined,
															data.customGridIcon,
															three_phase ? 'grid-icon-small' : 'grid-icon',
															three_phase ? '404' : '389',
															three_phase ? '339' : '308',
															three_phase ? 34 : 65,
															three_phase ? 34 : 65,
															true,
														)}
                        </g>
                    </a>`
				: svg`
                    <a href="#" @click=${(e) => Utils.handlePopup(e, config.entities.grid_connected_status_194)}>
                        <g display="${config.show_grid && (config.grid.import_icon || config.grid.disconnected_icon || config.grid.export_icon) ? '' : 'none'}">
                            ${renderIcon(
															undefined,
															data.customGridIcon,
															three_phase ? 'grid-icon-small' : 'grid-icon',
															three_phase ? '404' : '389',
															three_phase ? '339' : '308',
															three_phase ? 34 : 65,
															three_phase ? 34 : 65,
															true,
														)}
                        </g>
                    </a>`}
			<!-- Nonessential Icons-->
			${guard(
				[
					data.nonessentialLoads,
					data.showNonessential,
					data.iconNonessentialLoad1,
					data.iconNonessentialLoad2,
					data.nonessentialIcon,
					// Include colours that drive icon fill so updates are reflected
					data.dynamicColourNonEssentialLoad1,
					data.dynamicColourNonEssentialLoad2,
					data.gridColour,
				],
				() =>
					repeat(
						getNonEssentialIconConfigs(data),
						(iconConfig) => iconConfig.id,
						(iconConfig) => renderStaticGridIcon(iconConfig),
					),
			)}

			<g
				display="${!showNonessential || [1, 2, 3].includes(nonessentialLoads)
					? 'none'
					: ''}"
			>
				${renderIcon(
					undefined,
					data.nonessentialIcon,
					'noness-icon',
					303.5,
					303.5,
					85,
					85,
				)}
			</g>
			<g
				display="${!showNonessential || [0, 1].includes(nonessentialLoads)
					? 'none'
					: ''}"
			>
				${renderIcon(
					undefined,
					data.iconNonessentialLoad1,
					'nonessload1-icon',
					306,
					341,
				)}
			</g>
			<g
				display="${!showNonessential || [0, 1].includes(nonessentialLoads)
					? 'none'
					: ''}"
			>
				${renderIcon(
					undefined,
					data.iconNonessentialLoad2,
					'nonessload2-icon',
					343,
					341,
				)}
			</g>
			<g
				display="${!showNonessential || [0, 2, 3].includes(nonessentialLoads)
					? 'none'
					: ''}"
			>
				${renderIcon(
					undefined,
					data.iconNonessentialLoad1,
					'nonessload1-icon',
					324.5,
					341,
				)}
			</g>
			${createTextWithPopup(
				'daily_grid_buy_value',
				!showNonessential ? '311' : '347',
				!showNonessential
					? '354'
					: config.entities?.max_sell_power
						? '242'
						: '239',
				data.gridShowDailyBuy !== true || !data.stateDayGridImport.isValid(),
				'st10 left-align',
				data.stateDayGridImport.toNum() > 0 ? gridColour : 'grey',
				data.stateDayGridImport.toPowerString(true, data.decimalPlacesEnergy),
				(e) => Utils.handlePopup(e, config.entities.day_grid_import_76),
				true,
			)}
			${createTextWithPopup(
				'daily_grid_sell_value',
				!showNonessential ? '311' : '347',
				!showNonessential
					? '323'
					: config.entities?.max_sell_power
						? '212'
						: '209',
				data.gridShowDailySell !== true || !data.stateDayGridExport.isValid(),
				'st10 left-align',
				data.stateDayGridExport.toNum() > 0 ? gridColour : 'grey',
				data.stateDayGridExport.toPowerString(true, data.decimalPlacesEnergy),
				(e) => Utils.handlePopup(e, config.entities.day_grid_export_77),
				true,
			)}
			${createTextWithPopup(
				'max_sell_power',
				!showNonessential ? '311' : '347',
				!showNonessential ? '309' : '198',
				!data.stateMaxSellPower.isValid || !config.entities?.max_sell_power,
				'st3 left-align',
				['off', '0'].includes(data.stateSolarSell.state) ? 'grey' : gridColour,
				`${localize('common.limit')}: ${data.stateMaxSellPower.toPowerString(auto_scale, decimalPlaces)}`,
				(e) => Utils.handlePopup(e, config.entities.max_sell_power),
				true,
			)}
			${three_phase
				? config.entities?.grid_ct_power_total
					? svg`
                        ${createTextWithPopup(
													'grid_total_power',
													420,
													280,
													config.entities.grid_ct_power_172 === 'none',
													`${largeFont !== true ? 'st14' : 'st4'} st8`,
													gridRealBoxColour,
													auto_scale
														? `${
																config.grid.show_absolute
																	? Utils.convertValue(
																			Math.abs(totalGridPower),
																			decimalPlaces,
																		) || '0'
																	: Utils.convertValue(
																			totalGridPower,
																			decimalPlaces,
																		) || 0
															}`
														: `${
																config.grid.show_absolute
																	? `${Math.abs(totalGridPower)} ${UnitOfPower.WATT}`
																	: `${totalGridPower || 0} ${UnitOfPower.WATT}`
															}`,
													(e) =>
														Utils.handlePopup(
															e,
															config.entities.grid_ct_power_total,
														),
													true,
												)}`
					: svg`
                        ${renderText(
													'grid_total_power',
													420,
													280,
													config.entities.grid_ct_power_172 === 'none',
													`${largeFont !== true ? 'st14' : 'st4'} st8`,
													gridRealBoxColour,
													auto_scale
														? `${
																config.grid.show_absolute
																	? Utils.convertValue(
																			Math.abs(totalGridPower),
																			decimalPlaces,
																		) || '0'
																	: Utils.convertValue(
																			totalGridPower,
																			decimalPlaces,
																		) || 0
															}`
														: `${
																config.grid.show_absolute
																	? `${Math.abs(totalGridPower)} ${UnitOfPower.WATT}`
																	: `${totalGridPower || 0} ${UnitOfPower.WATT}`
															}`,
													true,
												)}`
				: svg`
                    ${createTextWithPopup(
											'grid_total_power',
											420,
											280,
											config.entities.grid_ct_power_172 === 'none',
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											gridRealBoxColour,
											auto_scale
												? `${
														config.grid.show_absolute
															? Utils.convertValue(
																	Math.abs(totalGridPower),
																	decimalPlaces,
																) || '0'
															: Utils.convertValue(
																	totalGridPower,
																	decimalPlaces,
																) || 0
													}`
												: `${
														config.grid.show_absolute
															? `${Math.abs(totalGridPower)} ${UnitOfPower.WATT}`
															: `${totalGridPower || 0} ${UnitOfPower.WATT}`
													}`,
											(e) =>
												Utils.handlePopup(e, config.entities.grid_ct_power_172),
											true,
										)}`}
			${config.entities?.grid_voltage
				? renderText(
						'grid_voltage_display',
						420,
						241,
						false,
						`${largeFont !== true ? 'st14' : 'st4'} st8`,
						gridRealBoxColour,
						`${Utils.formatNumberLocale(data.gridVoltage ?? 0, 0)} ${UnitOfElectricPotential.VOLT}`,
						true,
					)
				: ''}
			${config.entities?.grid_frequency
				? renderText(
						'grid_frequency_display',
						420,
						260,
						false,
						`${largeFont !== true ? 'st14' : 'st4'} st8`,
						gridRealBoxColour,
						`${Utils.formatNumberLocale(data.gridFrequency ?? 0, 1)} Hz`,
						true,
					)
				: ''}
			${config.entities?.nonessential_power &&
			config.entities.nonessential_power !== 'none'
				? svg`
                    ${createTextWithPopup(
											'non_ess_power',
											338,
											281.5,
											!showNonessential,
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											gridColour,
											auto_scale
												? `${Utils.convertValue(data.nonessentialPower, decimalPlaces) || 0}`
												: `${data.nonessentialPower || 0} ${UnitOfPower.WATT}`,
											(e) =>
												Utils.handlePopup(
													e,
													config.entities.nonessential_power,
												),
											true,
										)}`
				: svg`
                    ${renderText(
											'non_ess_power',
											338,
											281.5,
											!showNonessential,
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											gridColour,
											auto_scale
												? `${Utils.convertValue(data.nonessentialPower, decimalPlaces) || 0}`
												: `${data.nonessentialPower || 0} ${UnitOfPower.WATT}`,
											true,
										)}`}
			${totalGridPower >= 0
				? svg`
                    <a href="#" @click=${(e) => Utils.handlePopup(e, config.entities.energy_cost_buy)}>
                        ${renderText(
													'energy_cost',
													414,
													305,
													!!(
														config.entities?.energy_cost_buy &&
														data.stateEnergyCostBuy.isValid() &&
														!config.entities.non_essential_load2_extra
													),
													'st3 right-align',
													gridColour,
													`${Utils.formatNumberLocale(data.energyCost, 2)} ${data.stateEnergyCostBuy?.getUOM()}`,
												)}
                        ${renderText(
													'energy_cost',
													three_phase ? 414 : 430,
													305,
													!!(
														config.entities?.energy_cost_buy &&
														data.stateEnergyCostBuy.isValid() &&
														config.entities.non_essential_load2_extra
													),
													three_phase ? 'st3 right-align' : 'st3 left-align',
													gridColour,
													`${Utils.formatNumberLocale(data.energyCost, 2)}`,
												)}
                        ${renderText(
													'energy_cost',
													three_phase ? 414 : 437,
													318,
													!!(
														config.entities?.energy_cost_buy &&
														data.stateEnergyCostBuy.isValid() &&
														config.entities.non_essential_load2_extra
													),
													three_phase ? 'st3 right-align' : 'st3 left-align',
													gridColour,
													`${data.stateEnergyCostBuy?.getUOM()}`,
												)}
                    </a>`
				: svg`
                    <a href="#" @click=${(e) => Utils.handlePopup(e, config.entities.energy_cost_sell)}>
                        ${renderText(
													'energy_cost',
													414,
													305,
													!!(
														config.entities?.energy_cost_sell &&
														data.stateEnergyCostSell.isValid() &&
														!config.entities.non_essential_load2_extra
													),
													'st3 right-align',
													gridColour,
													`${Utils.formatNumberLocale(data.energyCost, 2)} ${data.stateEnergyCostSell?.getUOM()}`,
												)}
                        ${renderText(
													'energy_cost',
													three_phase ? 414 : 430,
													305,
													!!(
														config.entities?.energy_cost_sell &&
														data.stateEnergyCostSell.isValid() &&
														config.entities.non_essential_load2_extra
													),
													three_phase ? 'st3 right-align' : 'st3 left-align',
													gridColour,
													`${Utils.formatNumberLocale(data.energyCost, 2)}`,
												)}
                        ${renderText(
													'energy_cost',
													three_phase ? 414 : 437,
													318,
													!!(
														config.entities?.energy_cost_sell &&
														data.stateEnergyCostSell.isValid() &&
														config.entities.non_essential_load2_extra
													),
													three_phase ? 'st3 right-align' : 'st3 left-align',
													gridColour,
													`${data.stateEnergyCostSell?.getUOM()}`,
												)}
                    </a>`}
			${createTextWithPopup(
				'grid_power_169',
				270,
				three_phase ? 216 : 209,
				// Bỏ dòng W trong ô Grid-tie: công suất grid đã hiện riêng ở ô
				// "0 W" cạnh cột điện EVN, hiện thêm ở đây là dư thừa (theo thiết kế mới).
				true,
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				gridColour,
				auto_scale
					? `${
							config.grid.show_absolute
								? Utils.convertValue(
										Math.abs(autoScaledGridPower),
										decimalPlaces,
									) || '0'
								: Utils.convertValue(autoScaledGridPower, decimalPlaces) || 0
						}`
					: `${
							config.grid.show_absolute
								? `${Math.abs(autoScaledGridPower)} ${UnitOfPower.WATT}`
								: `${autoScaledGridPower || 0} ${UnitOfPower.WATT}`
						}`,
				(e) => Utils.handlePopup(e, config.entities.grid_power_169),
				true,
			)}
			${createTextWithPopup(
				'prepaid',
				428,
				258,
				!data.statePrepaidUnits.isValid(),
				config.entities?.prepaid_units ? 'st3 left-align' : 'st12',
				gridColour,
				Utils.formatNumberLocale(data.statePrepaidUnits.toNum(1), 1),
				(e) => Utils.handlePopup(e, config.entities.prepaid_units),
				true,
			)}
			${createTextWithPopup(
				'grid-power-L1',
				428,
				305,
				three_phase,
				'st3 left-align',
				gridColour,
				config.load.auto_scale
					? `${Utils.convertValue(data.gridPower, decimalPlaces) || 0}`
					: `${data.gridPower || 0} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.grid_ct_power_172),
			)}
			${createTextWithPopup(
				'grid-power-L2',
				428,
				318,
				!!(three_phase && config.entities?.grid_ct_power_L2),
				'st3 left-align',
				gridColour,
				config.load.auto_scale
					? `${Utils.convertValue(data.gridPowerL2, decimalPlaces) || 0}`
					: `${data.gridPowerL2 || 0} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.grid_ct_power_L2),
			)}
			${createTextWithPopup(
				'grid-power-L3',
				428,
				331,
				!!(three_phase && config.entities?.grid_ct_power_L3),
				'st3 left-align',
				gridColour,
				config.load.auto_scale
					? `${Utils.convertValue(data.gridPowerL3, decimalPlaces) || 0}`
					: `${data.gridPowerL3 || 0} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.grid_ct_power_L3),
			)}
			${createTextWithPopup(
				'inverter_voltage_154',
				[1, 2].includes(config.solar?.mppts) ? 295 : 310,
				// Khung dời xuống khớp Inverter/PV-tổng (y=162..212), tâm mới = 187.
				three_phase ? 173 : 177,
				config.entities.inverter_voltage_154 === 'none' ||
					!config.entities.inverter_voltage_154,
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				gridTieBusColour,
				`${Utils.formatNumberLocale(
					data.inverterVoltage,
					0,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_voltage_154),
				true,
			)}
			${createTextWithPopup(
				'inverter_voltage_L2',
				270,
				177,
				!!(three_phase && config.entities?.inverter_voltage_L2),
				largeFont !== true ? 'st14 st8' : 'st4 st8',
				gridTieBusColour,
				`${Utils.formatNumberLocale(
					data.inverterVoltageL2,
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_voltage_L2),
			)}
			${createTextWithPopup(
				'inverter_voltage_L3',
				270,
				190,
				!!(three_phase && config.entities?.inverter_voltage_L3),
				largeFont !== true ? 'st14 st8' : 'st4 st8',
				gridTieBusColour,
				`${Utils.formatNumberLocale(
					data.inverterVoltageL3,
					1,
				)} ${UnitOfElectricPotential.VOLT}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_voltage_L3),
			)}
			${createTextWithPopup(
				'load_frequency_192',
				[1, 2].includes(config.solar?.mppts) ? 295 : 310,
				three_phase ? '212' : '197',
				config.entities.load_frequency_192 === 'none' ||
					!config.entities.load_frequency_192,
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				gridTieBusColour,
				`${Utils.formatNumberLocale(data.loadFrequency, 1)} Hz`,
				(e) => Utils.handlePopup(e, config.entities.load_frequency_192),
				true,
			)}
			${renderText(
				'grid_tie_v_hz_label',
				[1, 2].includes(config.solar?.mppts) ? 295 : 310,
				three_phase ? '227' : '220',
				false,
				'st3',
				gridTieBusColour,
				'GRID-TIE',
				true,
			)}
			${createTextWithPopup(
				'noness1_value',
				340,
				321,
				!showNonessential ||
					[0, 2, 3].includes(nonessentialLoads) ||
					!data.stateNonessentialLoad1.isValid(),
				'st3',
				data.dynamicColourNonEssentialLoad1,
				data.stateNonessentialLoad1.toPowerString(auto_scale, decimalPlaces),
				(e) => Utils.handlePopup(e, config.entities.non_essential_load1),
				true,
			)}
			${createTextWithPopup(
				'noness2_value',
				320,
				321,
				!showNonessential ||
					[0, 1].includes(nonessentialLoads) ||
					!data.stateNonessentialLoad1.isValid(),
				'st3',
				data.dynamicColourNonEssentialLoad1,
				data.stateNonessentialLoad1.toPowerString(auto_scale, decimalPlaces),
				(e) => Utils.handlePopup(e, config.entities.non_essential_load1),
				true,
			)}
			${createTextWithPopup(
				'noness2_value',
				357,
				321,
				!showNonessential ||
					[0, 1].includes(nonessentialLoads) ||
					!data.stateNonessentialLoad2.isValid(),
				'st3',
				data.dynamicColourNonEssentialLoad2,
				data.stateNonessentialLoad2.toPowerString(auto_scale, decimalPlaces),
				(e) => Utils.handlePopup(e, config.entities.non_essential_load2),
				true,
			)}
			${createTextWithPopup(
				'non_ess_load1_value_extra',
				335,
				305,
				config.entities?.non_essential_load1_extra &&
					[1, 2, 3].includes(nonessentialLoads) &&
					data.stateNonEssentialLoad1Extra.isValid() &&
					config.show_grid &&
					showNonessential,
				'st3 right-align',
				data.dynamicColourNonEssentialLoad1,
				`${Utils.formatNumberLocale(
					data.stateNonEssentialLoad1Extra.toNum(1),
					1,
				)} ${data.stateNonEssentialLoad1Extra?.getUOM()}`,
				(e) => Utils.handlePopup(e, config.entities.non_essential_load1_extra),
			)}
			${createTextWithPopup(
				'non_ess_load2_value_extra',
				342,
				305,
				config.entities?.non_essential_load2_extra &&
					[2, 3].includes(nonessentialLoads) &&
					data.stateNonEssentialLoad2Extra.isValid() &&
					config.show_grid &&
					showNonessential,
				'st3 left-align',
				data.dynamicColourNonEssentialLoad2,
				`${Utils.formatNumberLocale(
					data.stateNonEssentialLoad2Extra.toNum(1),
					1,
				)} ${data.stateNonEssentialLoad2Extra?.getUOM()}`,
				(e) => Utils.handlePopup(e, config.entities.non_essential_load2_extra),
			)}
		</svg>
	`;
};
