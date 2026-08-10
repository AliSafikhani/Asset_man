# core/recommendations_60422.py

RECOMMENDATIONS = {

    # --- Chemical ---
    "water_content": {
        "ACTION": "Perform oil drying (vacuum dehydration or molecular sieve).",
        "ATTENTION": "Increase sampling frequency and check for leaks.",
        "DANGEROUS_TREND": "Immediate drying required; investigate source of moisture."
    },

    "acidity": {
        "ACTION": "Oil regeneration or complete oil replacement required.",
        "ATTENTION": "Plan oil treatment and monitor oxidation inhibitors.",
        "DANGEROUS_TREND": "Prepare regeneration program; ageing accelerating."
    },

    "interfacial_tension": {
        "ACTION": "Oil replacement recommended due to severe oxidation.",
        "ATTENTION": "Monitor oxidation and sludge formation.",
        "DANGEROUS_TREND": "Check sludge formation and paper ageing."
    },

    "dielectric_dissipation": {
        "ACTION": "Oil regeneration required; dielectric losses too high.",
        "ATTENTION": "Monitor closely; possible ageing products.",
        "DANGEROUS_TREND": "Check for thermal ageing and contamination."
    },

    "passivator_content": {
        "ACTION": "Add passivator or replace oil.",
        "ATTENTION": "Monitor inhibitor depletion.",
        "DANGEROUS_TREND": "Rapid inhibitor loss; high oxidation risk."
    },

    # --- Electrical ---
    "breakdown_voltage": {
        "ACTION": "Oil filtration and dehydration required.",
        "ATTENTION": "Check moisture and solid particles.",
        "DANGEROUS_TREND": "Investigate insulation degradation."
    },

    "volume_resistivity": {
        "ACTION": "Oil regeneration required.",
        "ATTENTION": "Monitor contamination level.",
        "DANGEROUS_TREND": "Rapid loss of insulating properties."
    },

    # --- Physical / visual ---
    "appearance": {
        "ACTION": "Oil regeneration or replacement.",
        "ATTENTION": "Monitor colour and turbidity.",
        "DANGEROUS_TREND": "Check for sludge and overheating."
    },

    "colour": {
        "ACTION": "Oil regeneration required.",
        "ATTENTION": "Monitor oxidation state.",
        "DANGEROUS_TREND": "Check thermal stress and oxidation."
    },

    "sediments": {
        "ACTION": "Immediate filtration or oil replacement.",
        "ATTENTION": "Monitor particle formation.",
        "DANGEROUS_TREND": "Severe sludge formation risk."
    },

    # --- Safety / HSE ---
    "flash_point": {
        "ACTION": "Oil replacement required; fire risk.",
        "ATTENTION": "Check contamination with light hydrocarbons.",
        "DANGEROUS_TREND": "High fire and explosion risk."
    },

    "pcbs": {
        "ACTION": "Remove oil and dispose according to environmental regulations.",
        "ATTENTION": "Plan decontamination program.",
        "DANGEROUS_TREND": "Immediate environmental and health risk."
    },

    # --- Oxidation stability ---
    "oxidation_stability_sludge": {
        "ACTION": "Oil regeneration or replacement.",
        "ATTENTION": "Monitor sludge formation.",
        "DANGEROUS_TREND": "Accelerated ageing of insulation."
    },

    "oxidation_stability_acidity": {
        "ACTION": "Oil regeneration required.",
        "ATTENTION": "Monitor oxidation inhibitors.",
        "DANGEROUS_TREND": "Rapid insulation ageing."
    },

    # --- Sulphur / additives ---
    "corrosive_sulphur": {
        "ACTION": "Immediate oil replacement.",
        "ATTENTION": "Check copper corrosion risk.",
        "DANGEROUS_TREND": "High risk of winding damage."
    },

    "dbds": {
        "ACTION": "Oil replacement or passivation required.",
        "ATTENTION": "Monitor sulphur content.",
        "DANGEROUS_TREND": "Severe copper sulphide risk."
    },

    # --- DGA ---
    "total_dissolved_gas": {
        "ACTION": "Perform full DGA analysis and fault diagnosis.",
        "ATTENTION": "Increase DGA sampling frequency.",
        "DANGEROUS_TREND": "Active internal fault suspected."
    },

    "hydrogen": {
        "ACTION": "Investigate partial discharge or overheating.",
        "ATTENTION": "Monitor discharge activity.",
        "DANGEROUS_TREND": "Rapid PD development."
    },

    "acetylene": {
        "ACTION": "Immediate investigation for arcing.",
        "ATTENTION": "Monitor electrical discharges.",
        "DANGEROUS_TREND": "Severe arcing fault likely."
    }
}