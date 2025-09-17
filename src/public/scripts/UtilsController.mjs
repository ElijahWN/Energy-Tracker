import ApplianceModel from "./ApplianceModel.mjs";
import ApplianceTypeModel from "./ApplianceTypeModel.mjs";

/**
 * Provides client-side utility functions for various calculations and data manipulations,
 * such as calculating energy consumption, validating data, and formatting.
 */
export default class UtilsController {
    /**
     * Gets the total power usage in a location
     *
     * @param {ApplianceModel[]}
     * @returns {Promise<Number>}
     */
    static async getLocationPower(appliances) {
        if (!Array.isArray(appliances)) return 0;

        let sum = 0;
        for (const app of appliances) {
            if (app) {
                sum += await this.getAppliancePower(app);
            }
        }
        return sum;
    }

    /**
     * Converts the number of watt hours into
     * a human readible string
     *
     * @param {number} wattHours
     * @returns {string}
     */
    static powerName(wattHours) {
        const numWattHours = Number(wattHours);
        if (isNaN(numWattHours)) {
            return "Invalid Input";
        }

        if (numWattHours < 1e3) {
            return `${numWattHours.toFixed(0)} W/Hrs`;
        } else if (numWattHours < 1e6) {
            return `${(numWattHours / 1e3).toFixed(1)} kW/Hrs`;
        } else if (numWattHours < 1e9) {
            return `${(numWattHours / 1e6).toFixed(1)} mW/Hrs`;
        } else {
            return `${(numWattHours / 1e9).toFixed(1)} gW/Hrs`;
        }
    }

    /**
     * Gets the power usage coming from
     * a single appliance
     *
     * @param {ApplianceModel} appliance
     * @returns {Promise<number>} Power usage in watt-hours, or 0 if invalid.
     */
    static async getAppliancePower(appliance) {
        if (!appliance || !appliance.type || !appliance.type.name) {
            return 0;
        }
        const applianceTypes = await ApplianceTypeModel.types;
        const appType = applianceTypes.find(
            (type) => type.name === appliance.type.name
        );

        if (!appType || typeof appType.watts !== "number") {
            return 0;
        }
        const hours = Number(appliance.hours) || 0;
        const quantity = Number(appliance.quantity) || 0;

        return appType.watts * hours * quantity;
    }

    /**
     * Creates a bar chart element.
     * 
     * @param {{name: string, weight: number}[]} data - Array of data objects.
     * @param {string} [title] - Optional chart title.
     * @param {number} [total] - Optional total for percentage calculation.
     * @param {boolean} [isEnergy=false] - Format weight as energy (w/Hrs)?
     * @returns {HTMLElement} The created bar chart container element.
     */
    static statsBarChart(data, title, total, isEnergy = false) {
        const statsCard = document.createElement("div");
        statsCard.classList.add("card");

        if (title) {
            const cardTitle = document.createElement("h2");
            cardTitle.classList.add("chart", "title");
            cardTitle.textContent = title;
            statsCard.appendChild(cardTitle);
        }

        if (!Array.isArray(data)) data = [];

        if (!total) {
            total = data.reduce(
                (sum, item) => sum + (Number(item.weight) || 0),
                0
            );
        }

        const bars = data
            .filter(
                (item) =>
                    item &&
                    typeof item.name === "string" &&
                    typeof item.weight === "number"
            )
            .sort((a, b) => b.weight - a.weight)
            .map((entry) => {
                const barContainer = document.createElement("div");
                barContainer.classList.add("bar", "container");

                const barLabel = document.createElement("span");
                barLabel.classList.add("bar", "label");
                barLabel.textContent = entry.name;

                const barWrapper = document.createElement("div");
                barWrapper.classList.add("bar", "wrapper");

                const barValue = document.createElement("span");
                barValue.classList.add("bar", "value");
                const displayValue = isEnergy
                    ? this.powerName(entry.weight)
                    : `${((entry.weight / total) * 100).toFixed(1)}%`;
                barValue.textContent = displayValue;

                const bar = document.createElement("div");
                bar.classList.add("bar", "fill");
                const percentage = total > 0 ? (entry.weight / total) * 100 : 0;
                bar.style.width = `${percentage}%`;

                barWrapper.append(bar, barValue);
                barContainer.append(barLabel, barWrapper);

                return barContainer;
            });

        statsCard.append(...bars);

        return statsCard;
    }

    /**
     * Creates a pie chart element with legend.
     * Adds standard section classes to the container.
     *
     * @param {{name: string, weight: number, prefix?: string}[]} data
     * @param {string} [title]
     * @param {number} [cutOff] - Max legend items before grouping into "Other".
     * @returns {HTMLElement} The created pie chart container element.
     */
    static statsPieChart(data, title, cutOff) {
        if (!Array.isArray(data)) data = [];

        let processedData = data
            .filter(
                (item) =>
                    item &&
                    typeof item.name === "string" &&
                    typeof item.weight === "number"
            )
            .sort((prev, curr) => curr.weight - prev.weight);

        let otherWeight = 0;
        let otherPrefix = undefined;

        if (cutOff && processedData.length > cutOff) {
            const otherItems = processedData.slice(cutOff);
            otherWeight = otherItems.reduce((sum, i) => sum + i.weight, 0);
            if (processedData[0]?.prefix) {
                otherPrefix = UtilsController.powerName(otherWeight);
            }
            processedData = processedData.slice(0, cutOff);
        }

        const finalData = [...processedData];
        if (otherWeight > 0) {
            finalData.push({
                name: "Other",
                weight: otherWeight,
                prefix: otherPrefix,
            });
        }

        const colors = this.generateColors(finalData.length);
        const total = finalData.reduce((sum, i) => sum + i.weight, 0);

        const statsCard = document.createElement("div");
        statsCard.classList.add(
            "stats",
            "section",
            "card",
            "margin",
            "bottom",
            "large"
        );

        if (title) {
            const statsTitle = document.createElement("h2");
            statsTitle.classList.add("chart", "title");
            statsTitle.textContent = title;
            statsCard.appendChild(statsTitle);
        }
        const chartLayoutContainer = document.createElement("div");
        chartLayoutContainer.classList.add(
            "pie-chart-layout",
            "flex",
            "column",
            "gap"
        );

        const chartContainer = document.createElement("div");
        chartContainer.classList.add("pie", "chart", "wrapper");
        const pieChart = this.drawPieChart(finalData, colors, total);
        chartContainer.appendChild(pieChart);

        const legendContainer = document.createElement("div");
        legendContainer.classList.add("pie", "legend");

        const legendKeys = finalData.map((entry, i) => {
            const legendKey = document.createElement("div");
            legendKey.classList.add("legend", "key");
            const bgColor = colors[i];
            legendKey.style.color = this.isColorDark(bgColor)
                ? "#ffffff"
                : "var(--color-text)";
            legendKey.style.borderColor = "rgba(0,0,0,0.2)";

            const colorIndicator = document.createElement("span");
            colorIndicator.classList.add("legend", "color", "indicator");
            colorIndicator.style.backgroundColor = colors[i];

            const nameSpan = document.createElement("span");
            nameSpan.classList.add("legend", "key", "name");
            nameSpan.textContent = entry.name;

            const valueSpan = document.createElement("span");
            valueSpan.classList.add("legend", "key", "value");
            const valueText = entry.prefix
                ? entry.prefix
                : total > 0
                ? `${((entry.weight / total) * 100).toFixed(1)}%`
                : "0%";
            valueSpan.textContent = valueText;

            legendKey.append(colorIndicator, nameSpan, valueSpan);
            legendKey.title = `${entry.name} - ${valueText}`;

            return legendKey;
        });

        legendContainer.append(...legendKeys);
        chartLayoutContainer.append(chartContainer, legendContainer);
        statsCard.appendChild(chartLayoutContainer);

        return statsCard;
    }

    /**
     * Draws the pie chart segments onto a canvas.
     * @param {{name: string, weight: number}[]} data - Data for segments.
     * @param {string[]} colors - Array of colors for segments.
     * @param {number} total - The total weight for percentage calculation.
     * @returns {HTMLCanvasElement} The canvas element with the pie chart.
     */
    static drawPieChart(data, colors, total) {
        const pieChart = document.createElement("canvas");
        const context = pieChart.getContext("2d");
        const radius = 100;
        pieChart.width = radius * 2;
        pieChart.height = radius * 2;
        const centerX = radius;
        const centerY = radius;

        let currentAngle = -Math.PI / 2;
        if (total <= 0) {
            context.beginPath();
            context.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
            context.strokeStyle = "#ccc";
            context.lineWidth = 1;
            context.stroke();
            return pieChart;
        }

        data.forEach((entry, i) => {
            const sliceAngle = (entry.weight / total) * 2 * Math.PI;
            const endAngle = currentAngle + sliceAngle;

            context.fillStyle = colors[i % colors.length];
            context.strokeStyle = "#000";
            context.lineWidth = 2;

            context.beginPath();
            context.moveTo(centerX, centerY);
            context.arc(centerX, centerY, radius - 10, currentAngle, endAngle);
            context.closePath();
            context.fill();
            context.stroke();

            currentAngle = endAngle;
        });

        return pieChart;
    }

    /**
     * Generates an array of distinct HSL colors.
     * @param {number} count - The number of colors to generate.
     * @returns {string[]} Array of CSS HSL color strings.
     */
    static generateColors(count) {
        const colors = [];
        const saturation = 70;
        const lightness = 65;
        const goldenAngle = 137.5;
        for (let i = 0; i < count; i++) {
            const hue = (i * goldenAngle) % 360;
            colors.push(
                `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness}%)`
            );
        }
        return colors;
    }

    /**
     * Determines if an HSL color is perceived as dark.
     * @param {string} hslColorString - e.g., "hsl(210, 70%, 65%)".
     * @returns {boolean} True if the color's lightness is below the threshold.
     */
    static isColorDark(hslColorString) {
        try {
            const match = hslColorString.match(
                /hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/
            );
            if (!match) return false;
            const lightness = parseInt(match[3], 10);
            return lightness < 55;
        } catch (e) {
            console.error("Error parsing HSL string:", e);
            return false;
        }
    }
}
