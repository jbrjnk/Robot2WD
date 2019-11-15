#ifndef PERSISTENTSTORAGE_H
#define PERSISTENTSTORAGE_H

#include <SmingCore/SmingCore.h>

class PersistentStorage
{
    public:
        bool GetValue(const String & key, /*out*/ String & outValue);
        void SetValue(const String & key, const String & value);
        void Delete(const String & key);
};

#endif