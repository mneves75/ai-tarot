#!/usr/bin/env python3
"""
Generate all 78 tarot card images using OpenAI DALL-E 3.
"""

import os
import sys
import time
import json
import base64
import httpx
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "cards"
API_KEY = os.environ.get("OPENAI_API_KEY")

if not API_KEY:
    print("Error: OPENAI_API_KEY not set")
    sys.exit(1)

# Art style prompt - consistent across all cards
ART_STYLE = """
Art style: Mystical tarot card illustration with rich symbolism.
Style: Art Nouveau meets contemporary digital art, reminiscent of the Rider-Waite deck but modernized.
Colors: Deep jewel tones (sapphire blue, emerald green, amethyst purple, ruby red) with gold accents.
Details: Intricate borders with celestial motifs, detailed symbolic imagery, atmospheric lighting.
Quality: High detail, professional illustration quality, centered composition.
Format: Vertical tarot card format with ornate decorative frame.
"""

# All 78 tarot cards with specific visual prompts
TAROT_CARDS = [
    # Major Arcana (0-21)
    {"code": "major_00_the_fool", "name": "The Fool", "prompt": "A young traveler in colorful clothes standing at the edge of a cliff, looking up at the sky with innocent joy, a small white dog at their feet, carrying a small bag on a stick, mountains in background, sun rising"},
    {"code": "major_01_the_magician", "name": "The Magician", "prompt": "A robed figure standing at a table with the four suit symbols (cup, wand, sword, pentacle), one hand pointing to the sky, one to the earth, infinity symbol above head, red and white robes, roses and lilies"},
    {"code": "major_02_the_high_priestess", "name": "The High Priestess", "prompt": "A serene woman seated between two pillars (one black, one white), crescent moon at her feet, wearing blue robes and a crown with moon phases, holding a scroll, veil with pomegranates behind her"},
    {"code": "major_03_the_empress", "name": "The Empress", "prompt": "A regal woman on a cushioned throne in a lush garden, wearing a crown of twelve stars, flowing gown with pomegranate pattern, wheat field at her feet, Venus symbol on heart-shaped shield"},
    {"code": "major_04_the_emperor", "name": "The Emperor", "prompt": "A stern bearded man on a stone throne carved with ram heads, wearing red robes and armor, holding an ankh scepter and orb, mountains behind, commanding presence"},
    {"code": "major_05_the_hierophant", "name": "The Hierophant", "prompt": "A religious figure in ornate papal robes between two pillars, wearing a triple crown, holding a triple cross scepter, two acolytes kneeling before him, crossed keys at feet"},
    {"code": "major_06_the_lovers", "name": "The Lovers", "prompt": "A man and woman standing beneath a radiant angel with purple wings, tree of knowledge with serpent behind woman, tree of flames behind man, sun blazing above"},
    {"code": "major_07_the_chariot", "name": "The Chariot", "prompt": "An armored warrior standing in a canopied chariot pulled by two sphinxes (one black, one white), city behind, starry canopy, crescent moons on shoulders, holding a wand"},
    {"code": "major_08_strength", "name": "Strength", "prompt": "A gentle woman in white robes calmly closing the jaws of a lion, infinity symbol above her head, flower garland in her hair, serene expression, mountain in background"},
    {"code": "major_09_the_hermit", "name": "The Hermit", "prompt": "An old bearded figure in gray hooded robes standing on a snowy mountain peak, holding a lantern with a six-pointed star inside, leaning on a staff, looking down from height"},
    {"code": "major_10_wheel_of_fortune", "name": "Wheel of Fortune", "prompt": "A great golden wheel with mystical symbols, sphinx at top holding sword, snake descending on left, jackal ascending on right, four winged creatures in corners (angel, eagle, lion, bull)"},
    {"code": "major_11_justice", "name": "Justice", "prompt": "A crowned figure seated between two pillars, holding a raised sword in right hand and balanced scales in left, red and green robes, square crown, purple veil behind"},
    {"code": "major_12_the_hanged_man", "name": "The Hanged Man", "prompt": "A man suspended upside-down by one foot from a wooden T-shaped cross, other leg bent to form a figure 4, serene face with a halo of light, hands behind back"},
    {"code": "major_13_death", "name": "Death", "prompt": "A skeleton knight in black armor riding a white horse, carrying a black flag with white rose emblem, figures of all social classes before him, sun rising between two towers in background"},
    {"code": "major_14_temperance", "name": "Temperance", "prompt": "A winged angel in flowing robes standing with one foot on land and one in water, pouring liquid between two cups, golden path leading to mountains, sun rising over peaks, irises growing"},
    {"code": "major_15_the_devil", "name": "The Devil", "prompt": "A horned, bat-winged figure with a goat's head perched on a black pedestal, inverted pentagram above, two figures chained loosely to the pedestal, torch lighting"},
    {"code": "major_16_the_tower", "name": "The Tower", "prompt": "A tall stone tower struck by lightning from dark clouds, crown toppling from top, two figures falling from windows, flames erupting, rain of golden drops falling"},
    {"code": "major_17_the_star", "name": "The Star", "prompt": "A woman kneeling by a pool, pouring water from two jugs onto land and into water, one large eight-pointed star above with seven smaller stars around it, bird in a tree"},
    {"code": "major_18_the_moon", "name": "The Moon", "prompt": "A full moon with a face in profile between two towers, a dog and wolf howling, a crayfish emerging from a pool, winding path leading to distant mountains, drops falling from moon"},
    {"code": "major_19_the_sun", "name": "The Sun", "prompt": "A radiant sun with a human face, a child riding a white horse beneath, arms outstretched joyfully, sunflowers blooming behind a wall, red banner waving"},
    {"code": "major_20_judgement", "name": "Judgement", "prompt": "An angel blowing a trumpet from clouds, figures rising from coffins below with arms raised, mountains and sea in background, flag with red cross on trumpet"},
    {"code": "major_21_the_world", "name": "The World", "prompt": "A dancing figure wrapped in purple cloth holding two wands, enclosed in a green laurel wreath, four creatures in corners (angel, eagle, lion, bull), cosmic background"},

    # Minor Arcana - Wands (22-35)
    {"code": "minor_wands_ace", "name": "Ace of Wands", "prompt": "A hand emerging from a cloud grasping a living wooden wand with green leaves sprouting, castle on distant hill, landscape with trees, floating leaves"},
    {"code": "minor_wands_02", "name": "Two of Wands", "prompt": "A man in red robes standing on castle battlements holding a globe in one hand, wand in other, second wand attached to wall, looking out over sea and mountains"},
    {"code": "minor_wands_03", "name": "Three of Wands", "prompt": "A merchant figure standing on cliff with back turned, three wands planted beside, watching ships sail on golden sea, expansive horizon"},
    {"code": "minor_wands_04", "name": "Four of Wands", "prompt": "Four wands forming a canopy decorated with garlands and flowers, two figures celebrating beneath with raised bouquets, castle in background, festive scene"},
    {"code": "minor_wands_05", "name": "Five of Wands", "prompt": "Five youths in different colored clothes battling with wooden wands, chaotic struggle without clear winner, blue sky background"},
    {"code": "minor_wands_06", "name": "Six of Wands", "prompt": "A victorious figure on horseback wearing a laurel wreath, holding a wand with wreath attached, crowd with five wands raised in celebration, triumphant procession"},
    {"code": "minor_wands_07", "name": "Seven of Wands", "prompt": "A young man on a hillside defending his position with a wand against six wands attacking from below, determined expression, precarious stance"},
    {"code": "minor_wands_08", "name": "Eight of Wands", "prompt": "Eight wands flying diagonally through clear blue sky over a river and landscape, moving swiftly toward their destination, sense of speed and motion"},
    {"code": "minor_wands_09", "name": "Nine of Wands", "prompt": "A wounded, bandaged man leaning on a wand defensively, eight wands standing like a fence behind him, wary expression, battle-worn appearance"},
    {"code": "minor_wands_10", "name": "Ten of Wands", "prompt": "A figure struggling to carry ten heavy wands bundled together, walking toward a distant town, bent under the burden, determined stride"},
    {"code": "minor_wands_page", "name": "Page of Wands", "prompt": "A youth in ornate tunic decorated with salamanders, holding a tall wand and gazing at it with curiosity, desert pyramids in background, feathered cap"},
    {"code": "minor_wands_knight", "name": "Knight of Wands", "prompt": "An armored knight on a rearing horse, brandishing a wand, salamanders on yellow tunic, pyramids and desert in background, charging forward boldly"},
    {"code": "minor_wands_queen", "name": "Queen of Wands", "prompt": "A crowned queen on a throne decorated with lions and sunflowers, holding a wand and sunflower, black cat at her feet, confident posture, yellow robes"},
    {"code": "minor_wands_king", "name": "King of Wands", "prompt": "A crowned king on a throne with salamander and lion motifs, holding a flowering wand, salamander at his feet, red robes, commanding presence"},

    # Minor Arcana - Cups (36-49)
    {"code": "minor_cups_ace", "name": "Ace of Cups", "prompt": "A hand emerging from cloud holding a golden chalice overflowing with five streams of water, dove descending with communion wafer, water lilies floating on pond below"},
    {"code": "minor_cups_02", "name": "Two of Cups", "prompt": "A young man and woman exchanging cups in a pledge, caduceus with lion head rising between them, winged lion above, symbols of partnership and union"},
    {"code": "minor_cups_03", "name": "Three of Cups", "prompt": "Three dancing maidens in flowing robes raising golden cups in celebration, garden of fruits and flowers around them, joyful harvest celebration"},
    {"code": "minor_cups_04", "name": "Four of Cups", "prompt": "A young man sitting cross-legged under a tree, contemplating three cups before him, a hand from cloud offering fourth cup which he doesn't notice"},
    {"code": "minor_cups_05", "name": "Five of Cups", "prompt": "A cloaked figure in black looking down at three spilled cups, two cups standing behind unnoticed, bridge over river leading to castle in distance"},
    {"code": "minor_cups_06", "name": "Six of Cups", "prompt": "A boy offering a cup filled with flowers to a girl in a garden, five other cups with flowers nearby, old house in background, nostalgic innocence"},
    {"code": "minor_cups_07", "name": "Seven of Cups", "prompt": "A silhouetted figure gazing at seven cups floating in clouds, each containing visions: castle, jewels, wreath, dragon, face, snake, glowing figure"},
    {"code": "minor_cups_08", "name": "Eight of Cups", "prompt": "A cloaked figure walking away from eight stacked cups toward mountains, waning moon in sky, crossing rocky terrain, leaving behind what was built"},
    {"code": "minor_cups_09", "name": "Nine of Cups", "prompt": "A well-dressed man sitting contentedly on a bench, nine golden cups arranged in an arc on a shelf behind him, arms crossed with satisfaction"},
    {"code": "minor_cups_10", "name": "Ten of Cups", "prompt": "A joyful couple with arms raised toward a rainbow of ten cups in sky, two dancing children beside them, peaceful cottage and river landscape"},
    {"code": "minor_cups_page", "name": "Page of Cups", "prompt": "A youth in floral tunic holding a cup from which a fish emerges, standing by the sea, looking at fish with wonder and curiosity"},
    {"code": "minor_cups_knight", "name": "Knight of Cups", "prompt": "A knight in armor on a calm white horse, holding a golden cup forward, winged helmet, river and trees in background, romantic demeanor"},
    {"code": "minor_cups_queen", "name": "Queen of Cups", "prompt": "A beautiful queen on a throne by the sea, holding an ornate covered chalice, gazing into it intently, shells and water motifs on throne"},
    {"code": "minor_cups_king", "name": "King of Cups", "prompt": "A crowned king on a throne floating on turbulent sea, holding cup and scepter calmly, fish amulet, ship in background, master of emotions"},

    # Minor Arcana - Swords (50-63)
    {"code": "minor_swords_ace", "name": "Ace of Swords", "prompt": "A hand emerging from cloud grasping a double-edged sword crowned with a wreath and crown, six mystical drops falling, mountain peak in background"},
    {"code": "minor_swords_02", "name": "Two of Swords", "prompt": "A blindfolded woman in white seated on stone bench, balancing two crossed swords, crescent moon over calm sea behind her"},
    {"code": "minor_swords_03", "name": "Three of Swords", "prompt": "A red heart pierced by three swords against a backdrop of storm clouds and rain, dramatic and sorrowful imagery"},
    {"code": "minor_swords_04", "name": "Four of Swords", "prompt": "A knight lying in repose on a tomb in a church, hands in prayer, three swords on wall above, one beneath, stained glass window"},
    {"code": "minor_swords_05", "name": "Five of Swords", "prompt": "A smug figure holding three swords watching two dejected figures walk away, two swords on ground, stormy sky, pyrrhic victory"},
    {"code": "minor_swords_06", "name": "Six of Swords", "prompt": "A ferryman poling a boat with a huddled woman and child, six swords standing in bow, moving from rough to calm waters"},
    {"code": "minor_swords_07", "name": "Seven of Swords", "prompt": "A figure sneaking away from military camp carrying five swords, two swords left behind, looking back over shoulder, tents in background"},
    {"code": "minor_swords_08", "name": "Eight of Swords", "prompt": "A blindfolded bound woman surrounded by eight swords stuck in ground, water at her feet, castle on distant cliff, imprisoned by thoughts"},
    {"code": "minor_swords_09", "name": "Nine of Swords", "prompt": "A figure sitting up in bed in despair, head in hands, nine swords on dark wall behind, quilt decorated with roses and astrological symbols"},
    {"code": "minor_swords_10", "name": "Ten of Swords", "prompt": "A figure lying face-down with ten swords in their back, dawn breaking over calm water in background, darkest before dawn"},
    {"code": "minor_swords_page", "name": "Page of Swords", "prompt": "A vigilant youth holding a sword upright, standing on rocky ground, wind blowing clouds and hair, birds in sky, ready stance"},
    {"code": "minor_swords_knight", "name": "Knight of Swords", "prompt": "An armored knight on a charging horse, sword raised high, cape and horse trappings flying in wind, storm clouds, rushing into battle"},
    {"code": "minor_swords_queen", "name": "Queen of Swords", "prompt": "A stern queen on a stone throne with butterfly and sylph carvings, holding upright sword, one hand raised, clouds around mountain throne"},
    {"code": "minor_swords_king", "name": "King of Swords", "prompt": "A crowned king on a throne with butterfly motifs, holding upright sword, purple robes, clear blue sky with clouds, cypress trees"},

    # Minor Arcana - Pentacles (64-77)
    {"code": "minor_pentacles_ace", "name": "Ace of Pentacles", "prompt": "A hand emerging from cloud holding a golden pentacle coin, lush garden with archway of roses below, path leading to mountains"},
    {"code": "minor_pentacles_02", "name": "Two of Pentacles", "prompt": "A dancing figure juggling two pentacles connected by an infinity ribbon, two ships on choppy seas in background, balance and adaptability"},
    {"code": "minor_pentacles_03", "name": "Three of Pentacles", "prompt": "A craftsman working on a cathedral arch showing design to two robed figures (monk and noble), three pentacles in the stonework, collaboration"},
    {"code": "minor_pentacles_04", "name": "Four of Pentacles", "prompt": "A crowned figure seated, clutching a pentacle to chest, one under each foot, one on crown, city in distant background, possessiveness"},
    {"code": "minor_pentacles_05", "name": "Five of Pentacles", "prompt": "Two impoverished figures in snow passing a lit stained-glass church window showing five pentacles, one on crutches, cold and destitute"},
    {"code": "minor_pentacles_06", "name": "Six of Pentacles", "prompt": "A wealthy merchant in red robes holding scales, giving coins to two kneeling beggars, six pentacles arranged around the scene"},
    {"code": "minor_pentacles_07", "name": "Seven of Pentacles", "prompt": "A young farmer leaning on a hoe, contemplating a bush bearing seven pentacles like fruit, evaluating his harvest, patient work"},
    {"code": "minor_pentacles_08", "name": "Eight of Pentacles", "prompt": "A craftsman at a workbench carefully carving pentacles, six finished pieces displayed on post, one in hand, city in distance, apprenticeship"},
    {"code": "minor_pentacles_09", "name": "Nine of Pentacles", "prompt": "An elegant woman in a vineyard with ripe grapes, hooded falcon on gloved hand, nine pentacles in the vines around her, luxury earned"},
    {"code": "minor_pentacles_10", "name": "Ten of Pentacles", "prompt": "An elderly patriarch under an archway with family (man, woman, child) and dogs, ten pentacles arranged in Tree of Life pattern, estate in background"},
    {"code": "minor_pentacles_page", "name": "Page of Pentacles", "prompt": "A youth in green tunic standing in flowering meadow, holding up a pentacle and gazing at it with fascination, trees in background"},
    {"code": "minor_pentacles_knight", "name": "Knight of Pentacles", "prompt": "A knight on a steady black horse, holding a pentacle, plowed field in background, oak leaves on helmet, methodical and reliable"},
    {"code": "minor_pentacles_queen", "name": "Queen of Pentacles", "prompt": "A crowned queen on a throne decorated with fruit and flowers, holding a pentacle in her lap, rabbit nearby, lush garden throne room"},
    {"code": "minor_pentacles_king", "name": "King of Pentacles", "prompt": "A crowned king on a throne carved with bull heads, surrounded by vines and grapes, holding pentacle and scepter, castle and gardens behind"},
]


def generate_image(prompt: str, card_name: str, output_path: Path, retry_count: int = 3) -> bool:
    """Generate a single tarot card image using OpenAI DALL-E 3."""
    full_prompt = f"Generate a tarot card illustration: {card_name}. {prompt}. {ART_STYLE}"

    for attempt in range(retry_count):
        try:
            print(f"  Generating (attempt {attempt + 1}/{retry_count})...")

            # Call OpenAI DALL-E 3 API directly
            response = httpx.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "dall-e-3",
                    "prompt": full_prompt,
                    "n": 1,
                    "size": "1024x1792",  # Vertical for tarot cards
                    "quality": "hd",
                    "response_format": "b64_json",
                },
                timeout=120.0,
            )

            if response.status_code == 200:
                data = response.json()
                image_b64 = data["data"][0]["b64_json"]
                image_bytes = base64.b64decode(image_b64)

                with open(output_path, "wb") as f:
                    f.write(image_bytes)
                print(f"  Saved: {output_path}")
                return True

            elif response.status_code == 429:
                wait_time = 60
                print(f"  Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)

            else:
                error_msg = response.text[:200]
                print(f"  Error {response.status_code}: {error_msg}")
                if attempt < retry_count - 1:
                    time.sleep(10)

        except Exception as e:
            print(f"  Error: {str(e)[:200]}")
            if attempt < retry_count - 1:
                time.sleep(10)

    return False


def main():
    """Generate all 78 tarot card images."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total cards to generate: {len(TAROT_CARDS)}")
    print(f"Using OpenAI DALL-E 3")
    print("-" * 60)

    # Track progress
    generated = []
    failed = []
    skipped = []

    for i, card in enumerate(TAROT_CARDS):
        code = card["code"]
        name = card["name"]
        prompt = card["prompt"]
        output_path = OUTPUT_DIR / f"{code}.png"

        print(f"\n[{i+1}/{len(TAROT_CARDS)}] {name} ({code})")

        # Skip if already exists
        if output_path.exists():
            print(f"  Already exists, skipping...")
            skipped.append(code)
            continue

        # Generate image
        if generate_image(prompt, name, output_path):
            generated.append(code)
        else:
            failed.append(code)

        # Rate limiting - pause between requests
        if i < len(TAROT_CARDS) - 1:
            time.sleep(2)  # 2 second delay between cards

    # Summary
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Generated: {len(generated)}")
    print(f"Skipped (existing): {len(skipped)}")
    print(f"Failed: {len(failed)}")

    if failed:
        print(f"\nFailed cards: {', '.join(failed)}")

    # Save manifest
    manifest = {
        "total": len(TAROT_CARDS),
        "generated": generated,
        "skipped": skipped,
        "failed": failed,
    }
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved: {manifest_path}")


if __name__ == "__main__":
    main()
