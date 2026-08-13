# standards/iec60422_recommendations.py
# IEC 60422:2024 - maintenance recommendations keyed by parameter and severity.
#
# NOTE: parameter keys corrected on port to match the canonical field names used
# throughout this module:
#     dielectric_dissipation -> dielectric_dissipation_90
#     pcbs                    -> pcb
#     volume_resistivity      -> volume_resistivity_90

RECOMMENDATIONS = {
    "water_content": {
        "ACTION": "Dry / reclaim the oil; investigate moisture ingress (seals, breather).",
        "ATTENTION": "Monitor moisture closely; consider on-line drying at next opportunity.",
        "DANGEROUS_TREND": "Moisture rising rapidly - locate ingress path and dry the oil.",
    },
    "acidity": {
        "ACTION": "Reclaim or replace the oil; high acidity accelerates sludging.",
        "ATTENTION": "Increase sampling frequency; plan reclamation.",
        "DANGEROUS_TREND": "Acidity climbing quickly - schedule reclamation.",
    },
    "breakdown_voltage": {
        "ACTION": "Recondition (filter/dry/degas) the oil before returning to service.",
        "ATTENTION": "Filter and dry the oil; recheck dielectric strength.",
        "DANGEROUS_TREND": "Dielectric strength falling - check for moisture / particles.",
    },
    "dielectric_dissipation_90": {
        "ACTION": "Reclaim the oil; investigate contamination or ageing by-products.",
        "ATTENTION": "Monitor dissipation factor; plan reconditioning.",
        "DANGEROUS_TREND": "Dissipation factor rising - assess contamination.",
    },
    "interfacial_tension": {
        "ACTION": "Reclaim the oil; low IFT indicates advanced degradation.",
        "ATTENTION": "Monitor IFT together with acidity for sludge risk.",
        "DANGEROUS_TREND": "IFT dropping - oil ageing accelerating.",
    },
    "colour": {
        "ACTION": "Investigate cause of darkening; consider reclamation.",
        "ATTENTION": "Track colour with other ageing markers.",
        "DANGEROUS_TREND": "Colour darkening quickly - review thermal loading.",
    },
    "appearance": {
        "ACTION": "Filter the oil; identify source of cloudiness / sediment.",
        "ATTENTION": "Recheck appearance after settling / filtering.",
        "DANGEROUS_TREND": "Appearance degrading - inspect for contamination.",
    },
    "sediments": {
        "ACTION": "Filter / reclaim the oil to remove sediment.",
        "ATTENTION": "Monitor sediment; plan filtration.",
        "DANGEROUS_TREND": "Sediment accumulating - schedule filtration.",
    },
    "sludge": {
        "ACTION": "Reclaim the oil; sludge impairs cooling and insulation.",
        "ATTENTION": "Monitor sludge with acidity and IFT.",
        "DANGEROUS_TREND": "Sludge forming - reclaim before deposits harden.",
    },
    "inhibitor_content": {
        "ACTION": "Re-inhibit the oil to restore oxidation protection.",
        "ATTENTION": "Plan re-inhibition; antioxidant is depleting.",
        "DANGEROUS_TREND": "Inhibitor depleting fast - re-inhibit soon.",
    },
    "passivator_content": {
        "ACTION": "Re-dose metal passivator; protect against corrosive sulphur.",
        "ATTENTION": "Monitor passivator level; plan re-dosing.",
        "DANGEROUS_TREND": "Passivator depleting - re-dose to maintain protection.",
    },
    "corrosive_sulphur": {
        "ACTION": "Treat with passivator or reclaim; corrosive sulphur detected.",
        "ATTENTION": "Confirm with repeat test; assess passivation.",
        "DANGEROUS_TREND": "Corrosive sulphur developing - apply passivator.",
    },
    "potentially_corrosive_sulphur": {
        "ACTION": "Apply passivator or reclaim; potentially corrosive sulphur present.",
        "ATTENTION": "Confirm result; evaluate passivation strategy.",
        "DANGEROUS_TREND": "Potentially corrosive sulphur developing - passivate.",
    },
    "dbds": {
        "ACTION": "Reclaim / replace oil; DBDS drives copper sulphide formation.",
        "ATTENTION": "Monitor DBDS; consider passivation.",
        "DANGEROUS_TREND": "DBDS rising - risk of copper sulphide deposits.",
    },
    "pcb": {
        "ACTION": "Handle as PCB-contaminated; follow disposal regulations.",
        "ATTENTION": "Confirm PCB level; plan compliant handling.",
        "DANGEROUS_TREND": "PCB contamination increasing - investigate source.",
    },
    "flash_point": {
        "ACTION": "Investigate low flash point (contamination / arcing); degas oil.",
        "ATTENTION": "Recheck flash point; assess for volatile contamination.",
        "DANGEROUS_TREND": "Flash point falling - check for fault gases / contamination.",
    },
    "volume_resistivity_90": {
        "ACTION": "Reclaim the oil; low resistivity indicates ionic contamination.",
        "ATTENTION": "Monitor resistivity with dissipation factor.",
        "DANGEROUS_TREND": "Resistivity dropping - assess contamination.",
    },
}


def get_recommendation(param, status):
    """Return the recommendation text for a parameter at a given severity.

    `status` accepts the NORMAL/ATTENTION/ACTION vocabulary; NORMAL yields ''.
    Pass 'DANGEROUS_TREND' for trend-driven recommendations.
    """
    entry = RECOMMENDATIONS.get(param)
    if not entry:
        return ""
    key = str(status).strip().upper()
    if key in ("NORMAL", "GOOD"):
        return ""
    return entry.get(key, "")
