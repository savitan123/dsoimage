import urllib.request

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def test_pattern(expected_filename):
    url = f'https://static.theskylive.com/website/sky/constellations/constellation_images/{expected_filename}.png'
    req = urllib.request.Request(url, headers=headers)
    try:
        urllib.request.urlopen(req)
        print(f"Success: {url}")
    except Exception as e:
        print(f"Failed: {url}")

test_pattern('canismajor')
test_pattern('canis_major')
test_pattern('ursa_major')
test_pattern('ursamajor')
test_pattern('canesvenatici')
