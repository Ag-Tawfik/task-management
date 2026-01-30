<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()
            ->where('is_admin', false)
            ->get();

        foreach ($users as $user) {
            Task::factory()
                ->count(3)
                ->for($user)
                ->create();
        }
    }
}
