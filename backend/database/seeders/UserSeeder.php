<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Deterministic demo user for Next.js login
        User::query()->updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'User',
                'password' => 'password',
                'is_admin' => false,
                'remember_token' => Str::random(10),
            ],
        );

        // Extra demo users
        User::factory()
            ->count(5)
            ->create();
    }
}

