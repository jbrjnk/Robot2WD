#include "PersistentStorage.h"

bool PersistentStorage::GetValue(const String & key, /*out*/ String & outValue)
{
    if(fileExist(key))
    {
        outValue = fileGetContent(key);
        return true;
    }
    else
    {
        return false;
    }
}

void PersistentStorage::SetValue(const String & key, const String & value)
{
    fileSetContent(key, value);
}

void PersistentStorage::Delete(const String & key)
{
    fileDelete(key);
}
