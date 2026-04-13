import re

TITLE_HE = {
    "The Exposure Triangle in Astrophotography": "משולש החשיפה בצילום אסטרונומי",
    "Calibration Frames (Darks, Flats, Biases)": "פריימים לכיול (חשוכות, שטוחות, הטיות)",
    "Backfocus": "מרחק פוקוס אחורי",
    "Equatorial (EQ) vs Alt-Azimuth (Alt-Az) Mounts": "הר משוואני (EQ) מול הר גובה-אזימוט (Alt-Az)",
    "Monochrome vs Color (OSC) Cameras": "מצלמה חד-גונית מול מצלמת צבע (OSC)",
    "Apochromatic Refractor (APO)": "רפרקטור אפוכרומטי (APO)",
    "Backfocal Distance (Backfocus)": "מרחק פוקוס אחורי (Backfocus)",
    "Harmonic Drive Mount": "הר דחף הרמוני",
    "Plate Solving": "זיהוי שמיים (Plate Solving)",
    "Off-Axis Guider (OAG)": "מנחה חוץ-צירי (OAG)",
    "Quantum Efficiency (QE)": "יעילות קוונטית (QE)",
    "Signal-to-Noise Ratio (SNR)": "יחס אות לרעש (SNR)",
    "Dithering": "דיתרינג (הזזת מסגרות)",
    "Linear vs. Non-Linear": "לינארי מול לא-לינארי",
    "Bayer Matrix (Debayering)": "מטריצת ביאר (Debayering)",
    "Hydrogen-Alpha (Hα)": "מימן-אלפא (Hα)",
    "Oxygen-III (OIII)": "חמצן-שלוש (OIII)",
    "Hubble Palette (SHO)": "לוח צבעים של האבל (SHO)",
    "The Bortle Scale": "סולם בורטל",
    "Astronomical Seeing": "ראיה אסטרונומית (Seeing)",
    "Bias Frame": "פריים הטיה (Bias)",
    "Dark Frame": "פריים חשוך (Dark)",
    "Flat Frame": "פריים שטוח (Flat)",
    "Dark-Flat Frame": "פריים חשוך-שטוח",
    "Master Frame": "פריים מאסטר",
    "Sub-frame Weighting": "שקילת תת-פריימים",
    "Pixel Rejection (Sigma Clipping)": "דחיית פיקסלים (חיתוך סיגמה)",
    "Registration (Alignment)": "יישור פריימים (Registration)",
    "Drizzle (Bayer Drizzle)": "דריזל (Bayer Drizzle)",
    "Deconvolution": "דה-קונבולוציה",
    "Star Reduction (Morphological Transformation)": "הקטנת כוכבים (טרנספורמציה מורפולוגית)",
    "SCNR (Subtractive Chromatic Noise Reduction)": "SCNR (הפחתת רעש כרומטי חיסורי)",
    "Local Histogram Equalization (LHE)": "איזון היסטוגרמה מקומי (LHE)",
    "PixelMath": "PixelMath",
    "Dynamic Background Extraction (DBE)": "חילוץ רקע דינמי (DBE)",
    "Right Ascension (RA)": "עלייה ישרה (RA)",
    "Declination (DEC)": "נטייה (DEC)",
    "Meridian": "מרידיאן",
    "Meridian Flip": "היפוך מרידיאן",
    "Celestial Equator": "קו המשווה השמיימי",
    "Emission Nebula": "ערפילית פליטה",
    "Reflection Nebula": "ערפילית השתקפות",
    "Dark Nebula": "ערפילית חשוכה",
    "Planetary Nebula": "ערפילית פלנטרית",
    "Supernova Remnant (SNR)": "שרידי סופרנובה (SNR)",
    "Airmass": "מסת אוויר",
    "Atmospheric Dispersion": "פיזור אטמוספרי",
    "Extinction": "כיבוי אור (Extinction)",
    "Integration Time (Total)": "זמן אינטגרציה כולל",
    "Opposition": "התנגדות (Opposition)",
    "Conjunction": "צימוד (Conjunction)",
    "Transit": "מעבר (Transit)",
    "Ecliptic Plane": "מישור האקליפטיקה",
    "Chromatic Aberration (Color Fringing)": "סטייה כרומטית (שוליים צבעוניים)",
    "Coma": "קומה (Coma)",
    "Field Curvature": "עיקום שדה",
    "Spherical Aberration": "סטייה כדורית",
    "Astigmatism": "אסטיגמטיזם",
    "ASCOM (Astronomy Common Object Model)": "ASCOM (מודל תקשורת אסטרונומי)",
    "INDI (Instrument Neutral Distributed Interface)": "INDI (ממשק מכשירים מבוזר)",
    "Sequencing": "תכנות רצף צילום",
    "Guiding Rate": "קצב הנחיה",
    "HFR (Half Flux Radius)": "HFR (רדיוס חצי שטף)",
    "Bandpass (Full Width at Half Maximum - FWHM)": "רוחב סרט (FWHM)",
    "Filter Haloing": "הילה של פילטר",
    "Signal Leakage (IR-Cut)": "דליפת אות (IR-Cut)",
    "Transmission Percentage": "אחוז מעבר פילטר",
    "Cable Snag / Cord Wrap": "פיתול כבלים",
    "12V Power Distribution (Powerbox)": "חלוקת חשמל 12V (Powerbox)",
    "Dew Point": "נקודת טל",
    "Histogram Stretching (Arsinh/Log)": "מתיחת היסטוגרמה (Arsinh/Log)",
    "Convolution vs. Deconvolution (Math)": "קונבולוציה מול דה-קונבולוציה (מתמטיקה)",
    "Noise Floor": "רצפת רעש",
    "Bit Depth (14-bit vs 16-bit)": "עומק סיביות (14-bit מול 16-bit)",
    "Spiral Galaxy (Grand Design)": "גלקסיה ספיראלית (Grand Design)",
    "Lenticular Galaxy": "גלקסיה עדשתית",
    "Flocculent Spiral": "ספירלה פתיתית",
    "Tidal Tail": "זנב גאותי",
    "Active Galactic Nucleus (AGN)": "גרעין גלקטי פעיל (AGN)",
    "B-V Color Index": "מדד צבע B-V",
    "Main Sequence": "סדרה ראשית",
    "Blue Straggler": "מאחר כחול",
    "Ionization Front": "חזית יינון",
    "Roof/Dome Automation": "אוטומציה של גג/כיפה",
    "Safety Monitor": "מוניטור בטיחות",
    "Latent Heat (Dew Control)": "חום סמוי (בקרת טל)",
    "Dynamic Flat Frames": "פריימים שטוחים דינמיים",
    "Abell Catalog (Abell Cluster)": "קטלוג אבל (אשכולות אבל)",
    "Arp Catalog (Atlas of Peculiar Galaxies)": "קטלוג ארפ (אטלס גלקסיות מיוחדות)",
    "Sharpless Catalog (Sh2)": "קטלוג שארפלס (Sh2)",
    "LDN (Lynds' Catalog of Dark Nebulae)": "LDN (קטלוג לינדס לערפיליות חשוכות)",
    "NGC (New General Catalogue)": "NGC (הקטלוג הכללי החדש)",
    "Periodic Error (PE)": "שגיאה תקופתית (PE)",
    "Backlash (Mechanical Slop)": "ריפיון מכני (Backlash)",
    "Cone Error": "שגיאת קונוס",
    "Polaris Offset": "סטיית קוטב צפון",
    "Microlens Diffraction (Star Micro-Reflections)": "עקיפת מיקרו-עדשה",
    "Amp Glow": "זוהר מגבר (Amp Glow)",
    "Blooming (CCD)": "בלומינג (CCD)",
    "Fixed Pattern Noise (FPN)": "רעש תבנית קבועה (FPN)",
    "Star Removal (StarNet / StarXTerminator)": "הסרת כוכבים (StarNet / StarXTerminator)",
    "AI Deconvolution (BlurXTerminator)": "דה-קונבולוציה בינה מלאכותית (BlurXTerminator)",
    "AI Noise Reduction (NoiseXTerminator / DeepSNR)": "הפחתת רעש בינה מלאכותית",
    "H-Alpha Solar Telescope (Etalon)": "טלסקופ שמשי Hα (איטלון)",
    "Solar Prominence": "פרומיננס שמשי",
    "Solar Filament": "חוט שמשי",
    "Granulation": "גרנולציה שמשית",
    "Light Year (ly)": "שנת אור (ly)",
    "Parsec (pc)": "פרסק (pc)",
    "Redshift (z)": "הזזה לאדום (z)",
    "Apparent Magnitude (m)": "בהירות נראית (m)",
    "Absolute Magnitude (M)": "בהירות מוחלטת (M)",
    "East-Heavy Balancing": "איזון מזרח-כבד",
    "Third-Axis Balance (DEC Axis)": "איזון ציר שלישי (ציר DEC)",
    "Cable Drag (Torque)": "גרירת כבלים (מומנט)",
    "Stiction (Static Friction)": "חיכוך סטטי (Stiction)",
    "Atmospheric Refraction": "שבירת אור אטמוספרית",
    "Scintillation": "ריצוד כוכבים (Scintillation)",
    "Sky Transparency": "שקיפות השמיים",
    "Rayleigh Scattering": "פיזור ריילי",
    "Full Well Capacity": "קיבולת מלאה של פוטאה",
    "Unity Gain": "רווח יחידה (Unity Gain)",
    "Read Noise": "רעש קריאה",
    "Dynamic Range (Stops)": "טווח דינמי",
    "Conversion Factor (e-/ADU)": "מקדם המרה (e-/ADU)",
    "Herbig-Haro Object (HH)": "עצם הרביג-הארו (HH)",
    "Wolf-Rayet Nebula (WR)": "ערפילית וולף-ריה (WR)",
    "Strömgren Sphere": "כדור שטרמגרן",
    "Proplyd (Protoplanetary Disk)": "פרופליד (דיסקת פרוטו-פלנטרית)",
    "Riccardi-Honders (RH)": "ריקרדי-הונדרס (RH)",
    "Corrected Dall-Kirkham (CDK)": "CDK - קורקטד דל-קירקהאם",
    "Rowe-Ackermann Schmidt Astrograph (RASA)": "RASA - אסטרוגרף",
    "Petzval Refractor": "רפרקטור פטצבל",
    "FITS Header (Flexible Image Transport System)": "כותרת FITS",
    "World Coordinate System (WCS)": "מערכת קואורדינטות עולמית (WCS)",
    "XISF (Extensible Image Serialization Format)": "פורמט XISF",
    "Bayer Phase (RGGB, GRBG, etc.)": "שלב ביאר (RGGB, GRBG וכו')",
    "Spectroscopic Binary": "כוכב כפול ספקטרוסקופי",
    "Eclipsing Binary": "כוכב כפול מסתיר",
    "Common Proper Motion (CPM) Pair": "זוג תנועה עצמית משותפת (CPM)",
    "Exoplanet Transit": "מעבר כוכב לכת חוץ-שמשי",
    "Primary Transit vs. Secondary Eclipse": "מעבר ראשי מול ליקוי משני",
    "Barycenter": "מרכז מסה (Barycenter)",
    "Multi-Star Guiding": "הנחיה רב-כוכבית",
    "SNIS (Signal-to-Noise Integrated Statistics)": "SNIS (סטטיסטיקה משולבת SNR)",
    "Aggressiveness (Guiding)": "אגרסיביות הנחיה",
    "MinMo (Minimum Motion)": "MinMo (תנועה מינימלית)",
    "Vignetting (Optical & Physical)": "וינייטינג (אופטי ופיזי)",
    "Shadowing (OAG Prism)": "הצללה (פריזמת OAG)",
    "Cepheid Variable": "כוכב משתנה צפאידי",
    "Cataclysmic Variable (CV)": "כוכב משתנה קטקליזמי (CV)",
    "RR Lyrae Star": "כוכב RR Lyrae",
    "Interstellar Reddening": "אדמומית בין-כוכבית",
    "Extinction Coefficient": "מקדם כיבוי אור",
    "Reflection Nebulosity (IFN - Integrated Flux Nebula)": "ערפיליות השתקפות (IFN)",
    "Ringing (Gibbs Phenomenon)": "תנודות גיבס (Ringing)",
    "Posterization (Banding)": "פוסטריזציה (פסים)",
    "Clipping (Black/White Point)": "גזירה (נקודות שחור/לבן)",
    "Sidereal Rate": "קצב כוכבי (Sidereal Rate)",
    "King Rate": "קצב קינג",
    "Tracking Jitter": "רעידות מעקב",
    "Starburst Galaxy": "גלקסיית פריצת כוכבים",
    "Galactic Cannibalism": "קניבליזם גלקטי",
    "Seyfert Galaxy": "גלקסיית סייפרט",
    "Spectroscopy": "ספקטרוסקופיה",
    "Absorption Lines (Fraunhofer Lines)": "קווי ספיגה (קווי פראונהופר)",
    "Emission Lines": "קווי פליטה",
    "Delta-T (Cooling Delta)": "דלתא-T (הפרש קירור)",
    "Thermal Noise (Dark Current)": "רעש תרמי (זרם חשוך)",
    "Sensor Frosting (Icing)": "קיפאון חיישן",
    "TEC (Thermo-Electric Cooling)": "קירור תרמו-אלקטרי (TEC)",
    "Critical Focus Zone (CFZ)": "אזור פוקוס קריטי (CFZ)",
    "Thermal Expansion (Focus Drift)": "התרחבות תרמית (נסיגת פוקוס)",
    "Mass Segregation": "הפרדת מסה",
    "Turn-off Point": "נקודת פרישה",
    "Core Collapse": "קריסת ליבה",
    "Open Cluster (Galactic Cluster)": "אשכול פתוח (גלקטי)",
    "Albedo": "אלבדו",
    "The Terminator": "הטרמינטור (קו גבול אור-צל)",
    "Limb Darkening": "החשכת שפה",
    "Phase Angle": "זווית פאזה",
    "Poisson Noise (Shot Noise)": "רעש פואסון (רעש ירי)",
    "Gaussian Noise (Electronic Noise)": "רעש גאוסי (אלקטרוני)",
    "Standard Deviation ($\\sigma$)": "סטיית תקן (σ)",
    "Bias Offset": "היסט הטיה",
    "Strehl Ratio": "יחס שטרל",
    "Airy Disk": "דיסקת אירי",
    "Roche Lobe": "אונת רוש",
    "Accretion Disk": "דיסקת צבירה",
    "Common Envelope Phase": "שלב מעטפה משותפת",
    "Aperture Photometry": "פוטומטריית צמצם",
    "Differential Photometry": "פוטומטריה דיפרנציאלית",
    "Full Width at Tenth Maximum (FWTM)": "רוחב מלא בעשירית המקסימום (FWTM)",
    "Conditional Logic (iif statements)": "לוגיקה מותנית (פקודות iif)",
    "Masked Integration": "אינטגרציה עם מסכה",
    "Rescale Function": "פונקציית שינוי קנה מידה",
    "Heliocentric Julian Date (HJD)": "תאריך יוליאני הליוצנטרי (HJD)",
    "Great Attractor": "המושך הגדול",
    "Lyman-alpha Forest": "יער ליימן-אלפא",
    "Salt and Pepper Noise": "רעש מלח ופלפל",
    "Interpolation Error": "שגיאת אינטרפולציה",
    "Optical Axis": "ציר אופטי",
    "Nyquist Sampling Theorem": "משפט דגימת ניקויסט",
    "Wavelength ($\\lambda$)": "אורך גל (λ)",
    "Photosphere": "פוטוספרה",
}

CATEGORY_HE = {
    "AI-Powered Processing Algorithms": "אלגוריתמי עיבוד מבוססי AI",
    "Advanced Field Effects": "תופעות שדה מתקדמות",
    "Advanced Filter Physics & Light Control": "פיזיקת פילטרים ובקרת אור",
    "Advanced Guiding & Tracking Metrics": "מדדי הנחיה ומעקב מתקדמים",
    "Advanced Noise Statistics & Math": "סטטיסטיקת רעש ומתמטיקה מתקדמת",
    "Advanced Optical Designs (High-End Rigs)": "עיצובים אופטיים מתקדמים",
    "Advanced Optics & Focus": "אופטיקה ופוקוס מתקדמים",
    "Advanced Optics Concepts": "מושגי אופטיקה מתקדמים",
    "Advanced Pixel Math & Logic Operations": "מתמטיקת פיקסלים ולוגיקה מתקדמת",
    "Advanced Processing": "עיבוד מתקדם",
    "Advanced Sensor Artifacts": "ארטיפקטים מתקדמים של חיישן",
    "Advanced Sensor Characteristics": "מאפייני חיישן מתקדמים",
    "Advanced Stacking": "סטאקינג מתקדם",
    "Advanced Tracking & Mount Physics": "פיזיקת מעקב והר מתקדמים",
    "Amateur Spectroscopy Basics": "יסודות ספקטרוסקופיה חובבנית",
    "Atmospheric & Environment": "אטמוספרה וסביבה",
    "Atmospheric Physics & Refraction": "פיזיקה אטמוספרית ושבירת אור",
    "Basic Concepts": "מושגי יסוד",
    "Binary & Multiple Star Dynamics": "דינמיקת כוכבים כפולים ומרובים",
    "Binary Star Evolution & Interaction": "אבולוציה ואינטראקציה של כוכבים כפולים",
    "Calibration & Data Integrity": "כיול ואמינות נתונים",
    "Celestial Coordinates & Navigation": "קואורדינטות שמיימיות וניווט",
    "Complex Nebular Structures & Stellar Evolution": "מבני ערפיליות ואבולוציה כוכבית",
    "Cosmological Scales & Distances": "סקלות קוסמולוגיות ומרחקים",
    "Deep Sky Object (DSO) Classifications": "סיווג עצמים עמוקים (DSO)",
    "Deep Sky Photometry & Measurement": "פוטומטריה ומדידת שמיים עמוקים",
    "Deep Space Catalogs (Beyond Messier)": "קטלוגים של שמיים עמוקים",
    "Equipment": "ציוד",
    "Exoplanet Transit & Detection": "מעבר וגילוי כוכבי לכת חוץ-שמשיים",
    "Final Technical Essentials": "יסודות טכניים - סיכום",
    "Galactic Evolution & Structures": "אבולוציה ומבנה גלקטי",
    "Galaxy Morphologies & Dynamics": "מורפולוגיה ודינמיקה של גלקסיות",
    "Hardware & Optics": "חומרה ואופטיקה",
    "Interstellar Extinction & Light Scattering": "כיבוי אור בין-כוכבי ופיזור",
    "Mount Mechanics & Physics": "מכניקה ופיזיקה של הר טלסקופ",
    "Mount Tuning, Balance & Torque": "כיוון ואיזון הר טלסקופ",
    "Narrowband & Filters": "צרי-פס ופילטרים",
    "Optical Aberrations": "סטיות אופטיות",
    "Planetary Surface Features & Geometry": "מאפייני פני שטח פלנטריים",
    "Post-Processing Mathematics": "מתמטיקה של עיבוד תמונה",
    "Power, Cables & Rig Management": "חשמל, כבלים וניהול ציוד",
    "Processing & Data Analysis": "עיבוד ואנליזת נתונים",
    "Professional Astronomy & Cosmology": "אסטרונומיה מקצועית וקוסמולוגיה",
    "Remote Observatory & Control": "מצפה כוכבים מרוחק ובקרה",
    "Scientific Image Metadata & Files": "מטאדאטה ופורמטי קובץ מדעיים",
    "Sensor Cooling & Thermal Dynamics": "קירור חיישן ודינמיקה תרמית",
    "Software, Scripting & Automation": "תוכנה, סקריפטינג ואוטומציה",
    "Solar Imaging & Physics": "צילום וחקר השמש",
    "Solar System Dynamics & Planetary Terms": "דינמיקת מערכת השמש",
    "Specialized Post-Processing Artifacts": "ארטיפקטים מיוחדים של עיבוד",
    "Star Cluster Dynamics & Evolution": "דינמיקה ואבולוציה של אשכולות כוכבים",
    "Technical Physics & Light": "פיזיקה טכנית ואור",
    "Terminology": "מינוח",
    "The Science of Star Color & Physics": "מדע צבע ופיזיקה של כוכבים",
    "Variable Star Classifications & Dynamics": "סיווג ודינמיקה של כוכבים משתנים",
}

with open('js/glossary_data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
current_title = None
i = 0
injected = 0
skipped = 0

while i < len(lines):
    line = lines[i]

    m = re.match(r'^(\s*)title: "(.+)",\s*$', line)
    if m:
        current_title = m.group(2)
        out.append(line)
        i += 1
        continue

    m2 = re.match(r'^(\s*)category: "(.+)",\s*$', line)
    if m2 and current_title is not None:
        indent = m2.group(1)
        cat_en = m2.group(2)
        out.append(line)
        i += 1

        # Skip if title_he already present
        if i < len(lines) and 'title_he:' in lines[i]:
            skipped += 1
            current_title = None
            continue

        t_he = TITLE_HE.get(current_title)
        c_he = CATEGORY_HE.get(cat_en)
        if t_he:
            out.append(f'{indent}title_he: "{t_he}",\n')
            injected += 1
        else:
            print(f"MISSING title_he for: {current_title!r}")
        if c_he:
            out.append(f'{indent}category_he: "{c_he}",\n')
        else:
            print(f"MISSING category_he for: {cat_en!r}")

        current_title = None
        continue

    if re.match(r'^\s*content:', line) or re.match(r'^\s*\}', line):
        current_title = None

    out.append(line)
    i += 1

with open('js/glossary_data.js', 'w', encoding='utf-8') as f:
    f.writelines(out)

print(f"Done. Injected: {injected}, Skipped (already had he): {skipped}")
