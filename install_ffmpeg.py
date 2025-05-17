import os
import zipfile
import shutil
import requests
import ctypes
import winreg

def download_ffmpeg():
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    zip_path = "ffmpeg.zip"
    extract_path = "C:\\ffmpeg"

    print("Downloading FFmpeg...")
    with requests.get(url, stream=True) as r:
        with open(zip_path, "wb") as f:
            shutil.copyfileobj(r.raw, f)

    print("Extracting FFmpeg...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        root_folder = zip_ref.namelist()[0].split('/')[0]
        zip_ref.extractall(".")

    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)
    shutil.move(root_folder, extract_path)

    os.remove(zip_path)
    print(f"FFmpeg extracted to {extract_path}")
    return extract_path

def add_to_path(ffmpeg_bin):
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment", 0, winreg.KEY_READ) as key:
        try:
            current_path, _ = winreg.QueryValueEx(key, "Path")
        except FileNotFoundError:
            current_path = ""

    if ffmpeg_bin.lower() in current_path.lower():
        print("FFmpeg is already in PATH.")
        return

    print("Adding FFmpeg to system PATH...")
    new_path = f"{current_path};{ffmpeg_bin}" if current_path else ffmpeg_bin
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment", 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)

    ctypes.windll.user32.SendMessageW(0xFFFF, 0x1A, 0, "Environment")
    print("FFmpeg added to PATH. Restart your terminal to use it.")

if __name__ == "__main__":
    ffmpeg_path = download_ffmpeg()
    ffmpeg_bin = os.path.join(ffmpeg_path, "bin")
    add_to_path(ffmpeg_bin)